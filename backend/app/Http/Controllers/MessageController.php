<?php

namespace App\Http\Controllers;

use App\Http\Resources\MessageResource;
use App\Http\Requests\StoreMessageRequest;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $messages = $request->user()
            ->receivedMessages()
            ->with('sender:id,name,email')
            ->latest('messages.created_at')
            ->paginate((int) $request->integer('per_page', 15));

        return response()->json([
            'data' => MessageResource::collection($messages->getCollection())->resolve($request),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ], Response::HTTP_OK);
    }

    public function sent(Request $request): JsonResponse
    {
        $messages = $request->user()
            ->sentMessages()
            ->with('recipients:id,name,email')
            ->latest()
            ->paginate((int) $request->integer('per_page', 15));

        return response()->json($messages, Response::HTTP_OK);
    }

    public function store(StoreMessageRequest $request): JsonResponse
    {
        $data = $request->validated();
        $sender = $request->user();
        $recipientIds = collect($data['recipient_ids'])
            ->reject(fn (string $recipientId) => $recipientId === $sender->id)
            ->values();

        if ($recipientIds->isEmpty()) {
            return response()->json([
                'message' => 'At least one valid recipient is required.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $message = DB::transaction(function () use ($sender, $data, $recipientIds) {
            $message = Message::create([
                'sender_id' => $sender->id,
                'body' => $data['body'],
            ]);

            $attachments = $recipientIds
                ->mapWithKeys(fn (string $id): array => [
                    $id => [
                        'is_read' => false,
                        'read_at' => null,
                    ],
                ])
                ->all();

            $message->recipients()->attach($attachments);

            return $message;
        });

        $message->load('sender:id,name,email', 'recipients:id,name,email');

        return response()->json($message, Response::HTTP_CREATED);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $updated = DB::table('message_recipient')
            ->where('recipient_id', $request->user()->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Messages marked as read.',
            'updated' => $updated,
        ], Response::HTTP_OK);
    }

    public function markAsRead(Request $request, Message $message): JsonResponse
    {
        $recipient = $message->recipients()
            ->where('users.id', $request->user()->id)
            ->first();

        if (!$recipient) {
            return response()->json([
                'message' => 'Message not found in your inbox.',
            ], Response::HTTP_NOT_FOUND);
        }

        $message->recipients()->updateExistingPivot($request->user()->id, [
            'is_read' => true,
            'read_at' => now(),
        ]);

        $notification = $request->user()
            ->receivedMessages()
            ->with('sender:id,name,email')
            ->where('messages.id', $message->id)
            ->first();

        return response()->json([
            'message' => 'Message marked as read.',
            'notification' => MessageResource::make($notification)->resolve($request),
        ], Response::HTTP_OK);
    }

    public function destroy(Request $request, Message $message): JsonResponse
    {
        $recipient = $message->recipients()
            ->where('users.id', $request->user()->id)
            ->first();

        if (!$recipient) {
            return response()->json([
                'message' => 'Message not found in your inbox.',
            ], Response::HTTP_NOT_FOUND);
        }

        $message->recipients()->detach($request->user()->id);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
