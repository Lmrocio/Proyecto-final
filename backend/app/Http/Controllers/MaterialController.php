<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Models\Course;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class MaterialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Material::query()
            ->with(['course:id,title,teacher_id'])
            ->latest();

        if ($user->role === 'teacher') {
            $query->whereHas('course', function ($courseQuery) use ($user) {
                $courseQuery->where('teacher_id', $user->id);
            });
        }

        if ($user->role === 'student') {
            $query->whereHas('course.enrollments', function ($enrollmentQuery) use ($user) {
                $enrollmentQuery
                    ->where('student_id', $user->id)
                    ->where('status', 'active');
            });
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->string('course_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 15)),
            Response::HTTP_OK
        );
    }

    public function store(StoreMaterialRequest $request): JsonResponse
    {
        $data = $request->validated();
        $course = Course::query()->findOrFail($data['course_id']);

        if ($request->user()->role === 'teacher' && $course->teacher_id !== $request->user()->id) {
            return response()->json([
                'message' => 'You can only upload materials for your own courses.',
            ], Response::HTTP_FORBIDDEN);
        }

        $path = $data['path'] ?? null;
        $size = null;

        if ($data['type'] === 'file') {
            $file = $request->file('file');
            $path = $file->store('materials', 'public');
            $size = $file->getSize();
        }

        $material = Material::create([
            'course_id' => $data['course_id'],
            'title' => $data['title'],
            'type' => $data['type'],
            'path' => $path,
            'size' => $size,
        ]);

        return response()->json($material->load('course:id,title,teacher_id'), Response::HTTP_CREATED);
    }

    public function show(Request $request, Material $material): JsonResponse
    {
        if (!$this->canAccessMaterial($request->user(), $material)) {
            return response()->json([
                'message' => 'Forbidden.',
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json($material->load('course:id,title,teacher_id'), Response::HTTP_OK);
    }

    public function destroy(Request $request, Material $material): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'admin' && !$material->course()->where('teacher_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'Forbidden.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($material->type === 'file' && !empty($material->path) && Storage::disk('public')->exists($material->path)) {
            Storage::disk('public')->delete($material->path);
        }

        $material->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    private function canAccessMaterial($user, Material $material): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'teacher') {
            return $material->course()->where('teacher_id', $user->id)->exists();
        }

        return $material->course()
            ->whereHas('enrollments', function ($enrollmentQuery) use ($user) {
                $enrollmentQuery
                    ->where('student_id', $user->id)
                    ->where('status', 'active');
            })
            ->exists();
    }
}
