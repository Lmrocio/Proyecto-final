<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Course::query()
            ->with(['teacher:id,name,email', 'bonus:id,name,type,price'])
            ->latest();

        if ($user->role === 'teacher') {
            $query->where('teacher_id', $user->id);
        }

        if ($user->role === 'student') {
            $query->whereHas('enrollments', function ($enrollmentQuery) use ($user) {
                $enrollmentQuery
                    ->where('student_id', $user->id)
                    ->where('status', 'active');
            });
        }

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->string('teacher_id'));
        }

        if ($request->filled('title')) {
            $query->where('title', 'like', '%'.$request->string('title').'%');
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 15)),
            Response::HTTP_OK
        );
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $data = $request->validated();

        $teacher = User::query()->findOrFail($data['teacher_id']);
        if ($teacher->role !== 'teacher') {
            return response()->json([
                'message' => 'teacher_id must belong to a teacher user.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $course = Course::create($data);

        return response()->json($course->load(['teacher:id,name,email', 'bonus:id,name,type,price']), Response::HTTP_CREATED);
    }

    public function show(Request $request, Course $course): JsonResponse
    {
        if (!$this->canAccessCourse($request->user(), $course)) {
            return response()->json([
                'message' => 'Forbidden.',
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json(
            $course->load(['teacher:id,name,email', 'bonus:id,name,type,price']),
            Response::HTTP_OK
        );
    }

    public function update(UpdateCourseRequest $request, Course $course): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('teacher_id', $data)) {
            $teacher = User::query()->findOrFail($data['teacher_id']);
            if ($teacher->role !== 'teacher') {
                return response()->json([
                    'message' => 'teacher_id must belong to a teacher user.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        $course->update($data);

        return response()->json($course->load(['teacher:id,name,email', 'bonus:id,name,type,price']), Response::HTTP_OK);
    }

    public function destroy(Course $course): JsonResponse
    {
        $course->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    private function canAccessCourse(User $user, Course $course): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'teacher') {
            return $course->teacher_id === $user->id;
        }

        return $course->enrollments()
            ->where('student_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }
}
