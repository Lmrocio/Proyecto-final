<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssignmentRequest;
use App\Http\Requests\UpdateAssignmentRequest;
use App\Http\Resources\AssignmentResource;
use App\Http\Resources\StudentAssignmentResource;
use App\Models\Assignment;
use App\Models\Course;
use App\Services\StudentAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AssignmentController extends Controller
{
    public function __construct(private readonly StudentAssignmentService $studentAssignmentService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Assignment::query()
            ->with(['course:id,title,teacher_id', 'course.teacher:id,name,email'])
            ->withCount('submissions')
            ->latest();

        if ($user->role === 'teacher') {
            $query->whereHas('course', fn ($courseQuery) => $courseQuery->where('teacher_id', $user->id));
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->string('course_id'));
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 15))
                ->through(fn (Assignment $assignment): AssignmentResource => new AssignmentResource($assignment)),
            Response::HTTP_OK
        );
    }

    public function store(StoreAssignmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $course = Course::query()->findOrFail($data['course_id']);

        if (!$this->canManageCourse($request->user(), $course)) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $assignment = Assignment::create($data);

        return response()->json(
            new AssignmentResource($assignment->load(['course:id,title,teacher_id', 'course.teacher:id,name,email'])->loadCount('submissions')),
            Response::HTTP_CREATED
        );
    }

    public function studentIndex(Request $request): JsonResponse
    {
        $assignments = $this->studentAssignmentService->forStudent($request->user());

        return response()->json([
            'data' => StudentAssignmentResource::collection($assignments)->resolve($request),
        ], Response::HTTP_OK);
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment): JsonResponse
    {
        if (!$this->canManageAssignment($request->user(), $assignment)) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $data = $request->validated();

        if (array_key_exists('course_id', $data)) {
            $course = Course::query()->findOrFail($data['course_id']);
            if (!$this->canManageCourse($request->user(), $course)) {
                return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
            }
        }

        $assignment->update($data);

        return response()->json(
            new AssignmentResource($assignment->load(['course:id,title,teacher_id', 'course.teacher:id,name,email'])->loadCount('submissions')),
            Response::HTTP_OK
        );
    }

    public function destroy(Request $request, Assignment $assignment): JsonResponse
    {
        if (!$this->canManageAssignment($request->user(), $assignment)) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $assignment->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    private function canManageAssignment($user, Assignment $assignment): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $assignment->course()->where('teacher_id', $user->id)->exists();
    }

    private function canManageCourse($user, Course $course): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $course->teacher_id === $user->id;
    }
}