<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\LevelTest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $now = now();
        $today = $now->toDateString();

        return response()->json([
            'active_students' => User::query()
                ->where('role', 'student')
                ->count(),
            'active_teachers' => User::query()
                ->where('role', 'teacher')
                ->count(),
            'active_courses' => Course::query()
                ->whereDate('start_date', '<=', $today)
                ->whereDate('end_date', '>=', $today)
                ->count(),
            'monthly_leads' => LevelTest::query()
                ->whereBetween('created_at', [
                    $now->copy()->startOfMonth(),
                    $now->copy()->endOfMonth(),
                ])
                ->count(),
        ], Response::HTTP_OK);
    }
}