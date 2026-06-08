<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\LevelTest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $now = now();
        $today = $now->toDateString();

        return response()->json([
            'active_students' => $this->activeUsersByRole('student'),
            'active_teachers' => $this->activeUsersByRole('teacher'),
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
            'recent_level_test_leads' => LevelTest::query()
                ->where('created_at', '>=', $now->copy()->subDay())
                ->count(),
        ], Response::HTTP_OK);
    }

    private function activeUsersByRole(string $role): int
    {
        $query = User::query()->where('role', $role);

        if (Schema::hasColumn('users', 'is_active')) {
            $query->where('is_active', true);
        }

        return $query->count();
    }
}