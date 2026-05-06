<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;

class DemoController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $courses = Course::query()
                ->with('teacher:id,name')
                ->latest()
                ->get()
                ->map(function (Course $course): array {
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'teacher_name' => $course->teacher?->name,
                        'start_date' => $course->start_date?->toDateString(),
                        'end_date' => $course->end_date?->toDateString(),
                        'meeting_link' => $course->meeting_link,
                    ];
                });
        } catch (QueryException) {
            $courses = collect([
                [
                    'id' => 'demo-general-english-b1',
                    'title' => 'General English B1',
                    'teacher_name' => 'Teacher Oliva',
                    'start_date' => now()->startOfWeek()->toDateString(),
                    'end_date' => now()->addMonths(3)->toDateString(),
                    'meeting_link' => 'https://meet.example.com/general-english-b1',
                ],
                [
                    'id' => 'demo-first-certificate-prep',
                    'title' => 'First Certificate Prep',
                    'teacher_name' => 'Teacher OpenClassy',
                    'start_date' => now()->addWeek()->toDateString(),
                    'end_date' => now()->addMonths(4)->toDateString(),
                    'meeting_link' => 'https://meet.example.com/fce-prep',
                ],
                [
                    'id' => 'demo-business-english',
                    'title' => 'Business English',
                    'teacher_name' => 'Teacher OpenClassy',
                    'start_date' => now()->addDays(10)->toDateString(),
                    'end_date' => now()->addMonths(2)->toDateString(),
                    'meeting_link' => 'https://meet.example.com/business-english',
                ],
            ]);
        }

        return response()->json([
            'courses' => $courses,
        ]);
    }
}
