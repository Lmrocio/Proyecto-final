<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBonusRequest;
use App\Http\Requests\UpdateBonusRequest;
use App\Models\Bonus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BonusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Bonus::query()->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 15)),
            Response::HTTP_OK
        );
    }

    public function store(StoreBonusRequest $request): JsonResponse
    {
        $bonus = Bonus::create($request->validated());

        return response()->json($bonus, Response::HTTP_CREATED);
    }

    public function show(Bonus $bonus): JsonResponse
    {
        return response()->json($bonus, Response::HTTP_OK);
    }

    public function update(UpdateBonusRequest $request, Bonus $bonus): JsonResponse
    {
        $bonus->update($request->validated());

        return response()->json($bonus, Response::HTTP_OK);
    }

    public function destroy(Bonus $bonus): JsonResponse
    {
        $bonus->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }
}
