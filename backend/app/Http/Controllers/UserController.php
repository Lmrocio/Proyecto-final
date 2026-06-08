<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function recipients(Request $request): JsonResponse
    {
        $columns = $this->hasSplitNameColumns()
            ? ['id', 'name', 'first_name', 'last_name', 'email', 'role']
            : ['id', 'name', 'email', 'role'];
        $users = $this->applyUserOrdering(User::query()->whereKeyNot($request->user()?->id))
            ->get($columns);

        return response()->json([
            'data' => UserResource::collection($users)->resolve($request),
        ], Response::HTTP_OK);
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->applyUserOrdering(User::query());

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        $users = $query->paginate((int) $request->integer('per_page', 15))
            ->through(fn (User $user): UserResource => new UserResource($user));

        return response()->json($users, Response::HTTP_OK);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $this->normalizeNamePayload($request->validated());
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json(new UserResource($user), Response::HTTP_CREATED);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(new UserResource($user), Response::HTTP_OK);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $this->normalizeNamePayload($request->validated());

        if ($request->user()?->is($user) && array_key_exists('is_active', $data) && $data['is_active'] === false) {
            return response()->json([
                'message' => 'You cannot deactivate your own account.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (array_key_exists('password', $data)) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json(new UserResource($user), Response::HTTP_OK);
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

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeNamePayload(array $data): array
    {
        $hasSplitNameColumns = $this->hasSplitNameColumns();
        $firstName = array_key_exists('first_name', $data)
            ? trim((string) ($data['first_name'] ?? ''))
            : null;
        $lastName = array_key_exists('last_name', $data)
            ? trim((string) ($data['last_name'] ?? ''))
            : null;
        $name = array_key_exists('name', $data)
            ? trim((string) ($data['name'] ?? ''))
            : null;

        if (($firstName === null || $lastName === null) && $name !== null && $name !== '') {
            [$derivedFirstName, $derivedLastName] = $this->splitFullName($name);
            $firstName = $firstName ?? $derivedFirstName;
            $lastName = $lastName ?? $derivedLastName;
        }

        if ($firstName !== null) {
            $data['first_name'] = $firstName;
        }

        if ($lastName !== null) {
            $data['last_name'] = $lastName;
        }

        if ($firstName !== null || $lastName !== null) {
            $data['name'] = trim((string) ($firstName ?? '').' '.(string) ($lastName ?? ''));
        }

        if (!$hasSplitNameColumns) {
            unset($data['first_name'], $data['last_name']);
        }

        if (!$this->hasActiveStatusColumn()) {
            unset($data['is_active']);
        }

        return $data;
    }

    private function hasSplitNameColumns(): bool
    {
        return Schema::hasColumn('users', 'first_name') && Schema::hasColumn('users', 'last_name');
    }

    private function hasActiveStatusColumn(): bool
    {
        return Schema::hasColumn('users', 'is_active');
    }

    private function applyUserOrdering(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        if ($this->hasSplitNameColumns()) {
            return $query
                ->orderByRaw("LOWER(COALESCE(last_name, ''))")
                ->orderByRaw("LOWER(COALESCE(first_name, name))")
                ->orderBy('created_at');
        }

        return $query
            ->orderByRaw('LOWER(name)')
            ->orderBy('created_at');
    }

    /**
     * @return array{0:string,1:string}
     */
    private function splitFullName(string $fullName): array
    {
        $normalizedName = trim((string) preg_replace('/\s+/', ' ', $fullName));

        if ($normalizedName === '') {
            return ['', ''];
        }

        $parts = explode(' ', $normalizedName, 2);

        return [$parts[0], $parts[1] ?? ''];
    }
}
