<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEnrollmentRequest;
use App\Http\Requests\UpdateEnrollmentRequest;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Enrollment::query()
            ->with(['student:id,name,email,role', 'course:id,title,teacher_id'])
            ->latest();

        if ($user->role === 'teacher') {
            $query->whereHas('course', function ($courseQuery) use ($user) {
                $courseQuery->where('teacher_id', $user->id);
            });
        }

        if ($user->role === 'student') {
            $query->where('student_id', $user->id);
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->string('course_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->string('student_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 15)),
            Response::HTTP_OK
        );
    }

    public function store(StoreEnrollmentRequest $request): JsonResponse
    {
        $data = $request->validated();

        $student = User::query()->findOrFail($data['student_id']);
        if ($student->role !== 'student') {
            return response()->json([
                'message' => 'student_id must belong to a student user.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $enrollment = Enrollment::updateOrCreate(
            [
                'student_id' => $data['student_id'],
                'course_id' => $data['course_id'],
            ],
            [
                'status' => $data['status'] ?? 'active',
            ]
        );

        $status = $enrollment->wasRecentlyCreated ? Response::HTTP_CREATED : Response::HTTP_OK;

        return response()->json($enrollment->load(['student:id,name,email,role', 'course:id,title,teacher_id']), $status);
    }

    public function show(Request $request, Enrollment $enrollment): JsonResponse
    {
        if (!$this->canAccessEnrollment($request->user(), $enrollment)) {
            return response()->json([
                'message' => 'Forbidden.',
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json($enrollment->load(['student:id,name,email,role', 'course:id,title,teacher_id']), Response::HTTP_OK);
    }

    public function update(UpdateEnrollmentRequest $request, Enrollment $enrollment): JsonResponse
    {
        $enrollment->update($request->validated());

        return response()->json($enrollment->load(['student:id,name,email,role', 'course:id,title,teacher_id']), Response::HTTP_OK);
    }

    public function destroy(Enrollment $enrollment): JsonResponse
    {
        $enrollment->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    private function canAccessEnrollment(User $user, Enrollment $enrollment): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'teacher') {
            return $enrollment->course()->where('teacher_id', $user->id)->exists();
        }

        return $enrollment->student_id === $user->id;
    }
}
