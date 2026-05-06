<?php

namespace App\Services;

use App\Models\SiteConfig;

class SiteConfigService
{
    public function getConfig(): SiteConfig
    {
        $config = SiteConfig::query()->first();

        if (!$config) {
            return SiteConfig::create($this->defaultConfig());
        }

        return $this->ensureUiVariant($config);
    }

    public function updateUiVariant(string $uiVariant): SiteConfig
    {
        $config = $this->getConfig();

        $config->update([
            'ui_variant' => $uiVariant,
        ]);

        return $config->refresh();
    }

    private function ensureUiVariant(SiteConfig $config): SiteConfig
    {
        if ($config->ui_variant) {
            return $config;
        }

        $config->update([
            'ui_variant' => 'v1',
        ]);

        return $config->refresh();
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
            'ui_variant' => 'v1',
        ];
    }
}