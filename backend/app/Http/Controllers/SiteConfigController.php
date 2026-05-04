<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSiteConfigRequest;
use App\Models\SiteConfig;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class SiteConfigController extends Controller
{
    public function show(): JsonResponse
    {
        $config = $this->loadOrCreateConfig();

        return response()->json([
            'config' => $config,
        ], Response::HTTP_OK);
    }

    public function update(UpdateSiteConfigRequest $request): JsonResponse
    {
        $data = $request->validated();
        $config = $this->loadOrCreateConfig();

        $config->update([
            'login_variant' => $data['login_variant'],
        ]);

        return response()->json([
            'config' => $config->fresh(),
        ], Response::HTTP_OK);
    }

    private function loadOrCreateConfig(): SiteConfig
    {
        $config = SiteConfig::query()->first();

        if ($config) {
            if (!$config->login_variant) {
                $config->update([
                    'login_variant' => 'v1',
                ]);
                $config->refresh();
            }

            return $config;
        }

        return SiteConfig::create($this->defaultConfig());
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultConfig(): array
    {
        return [
            'theme_name' => 'openclassy',
            'colors' => [
                'primary' => '#0f766e',
                'primary_contrast' => '#ecfeff',
                'surface' => '#f8fafc',
                'surface_strong' => '#ffffff',
                'text_main' => '#0f172a',
                'text_muted' => '#475569',
                'danger' => '#b91c1c',
                'ok' => '#166534',
            ],
            'login_variant' => 'v1',
        ];
    }
}
