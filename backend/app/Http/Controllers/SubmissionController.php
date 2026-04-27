<?php

namespace App\Http\Controllers;

use App\Http\Requests\GradeSubmissionRequest;
use App\Http\Requests\StoreSubmissionRequest;
use App\Models\Assignment;
use App\Models\Enrollment;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class SubmissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Submission::query()
            ->with([
                'student:id,name,email,role',
                'assignment:id,course_id,title,due_date',
                'assignment.course:id,title,teacher_id',
            ])
            ->latest();

        if ($user->role === 'teacher') {
            $query->whereHas('assignment.course', function ($courseQuery) use ($user) {
                $courseQuery->where('teacher_id', $user->id);
            });
        }

        if ($user->role === 'student') {
            $query->where('student_id', $user->id);
        }

        if ($request->filled('assignment_id')) {
            $query->where('assignment_id', $request->string('assignment_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->string('student_id'));
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 15)),
            Response::HTTP_OK
        );
    }

    public function store(StoreSubmissionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $student = $request->user();

        $assignment = Assignment::query()->with('course')->findOrFail($data['assignment_id']);

        $isEnrolled = Enrollment::query()
            ->where('course_id', $assignment->course_id)
            ->where('student_id', $student->id)
            ->where('status', 'active')
            ->exists();

        if (!$isEnrolled) {
            return response()->json([
                'message' => 'You must be enrolled in the assignment course to submit work.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $existing = Submission::query()
            ->where('assignment_id', $assignment->id)
            ->where('student_id', $student->id)
            ->first();

        $filePath = $existing?->file_path;
        if ($request->hasFile('file')) {
            if (!empty($existing?->file_path) && Storage::disk('public')->exists($existing->file_path)) {
                Storage::disk('public')->delete($existing->file_path);
            }

            $filePath = $request->file('file')->store('submissions', 'public');
        }

        $submission = Submission::updateOrCreate(
            [
                'assignment_id' => $assignment->id,
                'student_id' => $student->id,
            ],
            [
                'content' => $data['content'] ?? null,
                'file_path' => $filePath,
                'grade' => null,
                'teacher_feedback' => null,
            ]
        );

        $status = $submission->wasRecentlyCreated ? Response::HTTP_CREATED : Response::HTTP_OK;

        return response()->json(
            $submission->load(['student:id,name,email,role', 'assignment:id,course_id,title,due_date']),
            $status
        );
    }

    public function show(Request $request, Submission $submission): JsonResponse
    {
        if (!$this->canAccessSubmission($request->user(), $submission)) {
            return response()->json([
                'message' => 'Forbidden.',
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json(
            $submission->load(['student:id,name,email,role', 'assignment:id,course_id,title,due_date', 'assignment.course:id,title,teacher_id']),
            Response::HTTP_OK
        );
    }

    public function grade(GradeSubmissionRequest $request, Submission $submission): JsonResponse
    {
        $actor = $request->user();

        if ($actor->role === 'teacher' && !$submission->assignment()->whereHas('course', function ($courseQuery) use ($actor) {
            $courseQuery->where('teacher_id', $actor->id);
        })->exists()) {
            return response()->json([
                'message' => 'You can only grade submissions from your own courses.',
            ], Response::HTTP_FORBIDDEN);
        }

        $submission->update($request->validated());

        return response()->json(
            $submission->load(['student:id,name,email,role', 'assignment:id,course_id,title,due_date']),
            Response::HTTP_OK
        );
    }

    private function canAccessSubmission($user, Submission $submission): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'teacher') {
            return $submission->assignment()->whereHas('course', function ($courseQuery) use ($user) {
                $courseQuery->where('teacher_id', $user->id);
            })->exists();
        }

        return $submission->student_id === $user->id;
    }
}
