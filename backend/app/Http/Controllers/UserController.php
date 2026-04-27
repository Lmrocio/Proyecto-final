<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->latest();

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        $users = $query->paginate((int) $request->integer('per_page', 15));

        return response()->json($users, Response::HTTP_OK);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json($user, Response::HTTP_CREATED);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user, Response::HTTP_OK);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('password', $data)) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json($user, Response::HTTP_OK);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()?->is($user)) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }
}
