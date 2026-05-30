<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\Material;
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
        $this->authorize('view', $course);

        return response()->json(
            $course->load(['teacher:id,name,email', 'bonus:id,name,type,price']),
            Response::HTTP_OK
        );
    }

    public function content(Request $request, Course $course): JsonResponse
    {
        $this->authorize('view', $course);

        $course->load('teacher:id,name');

        $materials = $course->materials()->latest()->get();
        $assignments = $course->assignments()->orderBy('due_date')->get();

        $materialsByUnit = $materials->groupBy(fn (Material $material) => $material->unit_name ?? 'Unidad general');
        $assignmentsByUnit = $assignments->groupBy(fn (Assignment $assignment) => $assignment->unit_name ?? 'Unidad general');

        $unitNames = $materialsByUnit->keys()
            ->merge($assignmentsByUnit->keys())
            ->unique()
            ->values();

        $units = $unitNames->map(function (string $unitName) use ($materialsByUnit, $assignmentsByUnit): array {
            $unitMaterials = $materialsByUnit->get($unitName, collect());
            $unitAssignments = $assignmentsByUnit->get($unitName, collect());

            return [
                'unit_name' => $unitName,
                'materials' => $unitMaterials->map(function (Material $material): array {
                    return [
                        'id' => $material->id,
                        'title' => $material->title,
                        'type' => $material->type,
                        'path' => $material->path,
                        'size' => $material->size,
                        'unit_name' => $material->unit_name,
                    ];
                })->values(),
                'assignments' => $unitAssignments->map(function (Assignment $assignment): array {
                    return [
                        'id' => $assignment->id,
                        'title' => $assignment->title,
                        'description' => $assignment->description,
                        'due_date' => $assignment->due_date?->toDateTimeString(),
                        'unit_name' => $assignment->unit_name,
                    ];
                })->values(),
                'resource_counts' => [
                    'file' => $unitMaterials->where('type', 'file')->count(),
                    'link' => $unitMaterials->where('type', 'link')->count(),
                    'video' => $unitMaterials->where('type', 'video')->count(),
                    'audio' => $unitMaterials->where('type', 'audio')->count(),
                    'assignment' => $unitAssignments->count(),
                ],
            ];
        });

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'teacher_name' => $course->teacher?->name,
                'meeting_link' => $course->meeting_link,
            ],
            'units' => $units,
        ], Response::HTTP_OK);
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
}
