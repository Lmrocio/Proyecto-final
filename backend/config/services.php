<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'openrouter' => [
        'key' => env('OPENROUTER_API_KEY', env('OPENAI_API_KEY')),
        'model' => env('OPENROUTER_MODEL', 'google/gemini-2.0-flash-lite-001'),
        'endpoint' => env('OPENROUTER_ENDPOINT', 'https://openrouter.ai/api/v1/chat/completions'),
        'timeout' => (int) env('OPENROUTER_TIMEOUT', env('OPENAI_TIMEOUT', 30)),
        'verify' => env('OPENROUTER_VERIFY_SSL', env('OPENAI_VERIFY_SSL', true)),
        'max_tokens' => (int) env('OPENROUTER_MAX_TOKENS', 700),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
