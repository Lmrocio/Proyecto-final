<!DOCTYPE html>
<html lang="{{ str_replace('__', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'OpenClassy') }}</title>
    <style>
        :root {
            color-scheme: light;
        }
        body {
            margin: 0;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fb;
            color: #1f2937;
        }
        .container {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
        }
        .card {
            width: 100%;
            max-width: 720px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }
        h1 {
            margin: 0 0 8px;
            font-size: 28px;
            line-height: 1.2;
        }
        p {
            margin: 0;
            color: #4b5563;
            line-height: 1.6;
        }
        .meta {
            margin-top: 20px;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
<div class="container">
    <main class="card">
        <h1>{{ config('app.name', 'OpenClassy') }} Backend</h1>
        <p>API base de Laravel lista para desarrollo.</p>
        <p class="meta">Laravel v{{ Illuminate\Foundation\Application::VERSION }} | PHP v{{ PHP_VERSION }}</p>
    </main>
</div>
</body>
</html>
