<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\BonusController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DemoController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\LevelTestController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\SiteConfigController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/demo-data', [DemoController::class, 'index']);

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::get('/site-config', [SiteConfigController::class, 'show']);
Route::post('/level-tests', [LevelTestController::class, 'store'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{course}', [CourseController::class, 'show']);
    Route::get('/student/courses/{course}/content', [CourseController::class, 'content']);

    Route::get('/enrollments', [EnrollmentController::class, 'index']);
    Route::get('/enrollments/{enrollment}', [EnrollmentController::class, 'show']);

    Route::get('/attendances', [AttendanceController::class, 'index']);

    Route::get('/bonuses', [BonusController::class, 'index']);
    Route::get('/bonuses/{bonus}', [BonusController::class, 'show']);

    Route::get('/materials', [MaterialController::class, 'index']);
    Route::get('/materials/{material}', [MaterialController::class, 'show']);

    Route::get('/submissions', [SubmissionController::class, 'index']);
    Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);

    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/sent', [MessageController::class, 'sent']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::patch('/messages/read-all', [MessageController::class, 'markAllAsRead']);
    Route::patch('/messages/{message}/read', [MessageController::class, 'markAsRead']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);

        Route::put('/admin/settings', [SiteConfigController::class, 'update']);

        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{course}', [CourseController::class, 'update']);
        Route::delete('/courses/{course}', [CourseController::class, 'destroy']);

        Route::post('/enrollments', [EnrollmentController::class, 'store']);
        Route::put('/enrollments/{enrollment}', [EnrollmentController::class, 'update']);
        Route::delete('/enrollments/{enrollment}', [EnrollmentController::class, 'destroy']);

        Route::post('/bonuses', [BonusController::class, 'store']);
        Route::put('/bonuses/{bonus}', [BonusController::class, 'update']);
        Route::delete('/bonuses/{bonus}', [BonusController::class, 'destroy']);
    });

    Route::middleware('role:admin,teacher')->group(function () {
        Route::post('/attendances', [AttendanceController::class, 'store']);
        Route::patch('/attendances/{attendance}', [AttendanceController::class, 'update']);

        Route::post('/materials', [MaterialController::class, 'store']);
        Route::delete('/materials/{material}', [MaterialController::class, 'destroy']);

        Route::patch('/submissions/{submission}/grade', [SubmissionController::class, 'grade']);
    });

    Route::middleware('role:student')->group(function () {
        Route::get('/student/assignments', [AssignmentController::class, 'studentIndex']);
        Route::post('/submissions', [SubmissionController::class, 'store']);
    });
});
