<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Models\Attendance;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Attendance::query()
            ->with(['user:id,name,email,role', 'course:id,title,teacher_id'])
            ->latest('date');

        if ($user->role === 'teacher') {
            $query->whereHas('course', function ($courseQuery) use ($user) {
                $courseQuery->where('teacher_id', $user->id);
            });
        }

        if ($user->role === 'student') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->string('course_id'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->string('user_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->string('date'));
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 15)),
            Response::HTTP_OK
        );
    }

    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $actor = $request->user();

        $course = Course::query()->findOrFail($data['course_id']);

        if ($actor->role === 'teacher' && $course->teacher_id !== $actor->id) {
            return response()->json([
                'message' => 'You can only mark attendance for your own courses.',
            ], Response::HTTP_FORBIDDEN);
        }

        $targetUser = User::query()->findOrFail($data['user_id']);
        if ($targetUser->role !== 'student') {
            return response()->json([
                'message' => 'Attendance can only be marked for students.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $isEnrolled = Enrollment::query()
            ->where('course_id', $data['course_id'])
            ->where('student_id', $data['user_id'])
            ->where('status', 'active')
            ->exists();

        if (!$isEnrolled) {
            return response()->json([
                'message' => 'Student is not actively enrolled in this course.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $attendance = Attendance::updateOrCreate(
            [
                'user_id' => $data['user_id'],
                'course_id' => $data['course_id'],
                'date' => $data['date'],
            ],
            [
                'status' => $data['status'],
                'is_online' => $data['is_online'] ?? false,
            ]
        );

        $status = $attendance->wasRecentlyCreated ? Response::HTTP_CREATED : Response::HTTP_OK;

        return response()->json($attendance->load(['user:id,name,email,role', 'course:id,title,teacher_id']), $status);
    }

    public function update(UpdateAttendanceRequest $request, Attendance $attendance): JsonResponse
    {
        $actor = $request->user();

        if ($actor->role === 'teacher' && !$attendance->course()->where('teacher_id', $actor->id)->exists()) {
            return response()->json([
                'message' => 'You can only update attendance for your own courses.',
            ], Response::HTTP_FORBIDDEN);
        }

        $attendance->update($request->validated());

        return response()->json($attendance->load(['user:id,name,email,role', 'course:id,title,teacher_id']), Response::HTTP_OK);
    }
}
