<?php

namespace App\Http\Controllers;

use App\Http\Resources\StudentAssignmentResource;
use App\Services\StudentAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AssignmentController extends Controller
{
    public function __construct(private readonly StudentAssignmentService $studentAssignmentService)
    {
    }

    public function studentIndex(Request $request): JsonResponse
    {
        $assignments = $this->studentAssignmentService->forStudent($request->user());

        return response()->json([
            'data' => StudentAssignmentResource::collection($assignments)->resolve($request),
        ], Response::HTTP_OK);
    }
}