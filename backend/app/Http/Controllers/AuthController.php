<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ], Response::HTTP_OK);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ], Response::HTTP_OK);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json(new UserResource($request->user()), Response::HTTP_OK);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json(new UserResource($user->refresh()), Response::HTTP_OK);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->string('current_password'), $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->update([
            'password' => Hash::make($request->string('password')),
        ]);

        return response()->json([
            'message' => 'Password updated.',
        ], Response::HTTP_OK);
    }

    public function updateMessagingSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'receive_individual_email' => ['required', 'boolean'],
            'receive_course_email' => ['required', 'boolean'],
            'read_receipts_enabled' => ['required', 'boolean'],
            'automatic_signature_enabled' => ['required', 'boolean'],
            'signature' => ['nullable', 'string', 'max:1000'],
            'undo_send_enabled' => ['required', 'boolean'],
            'undo_send_delay_seconds' => ['nullable', 'integer', 'min:5', 'max:30'],
        ]);

        $user = $request->user();
        $settings = $user->accessibility_settings ?? [];
        $settings['messaging'] = $data;
        $user->update(['accessibility_settings' => $settings]);

        return response()->json([
            'settings' => $data,
            'user' => new UserResource($user->refresh()),
        ], Response::HTTP_OK);
    }

    public function destroyAccount(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->user()?->currentAccessToken()?->delete();
        $user->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }
}
