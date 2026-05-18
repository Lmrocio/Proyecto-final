<?php

namespace App\Services;

use App\Models\SiteConfig;
use InvalidArgumentException;

class SiteConfigService
{
    private const DEFAULT_UI_VARIANT = 'v1';

    private const THEME_PALETTES = [
        'v1' => [
            'primary' => '#333D29',
            'primary_contrast' => '#EBE2C3',
            'surface' => '#EBE2C3',
            'surface_strong' => '#DBCEA1',
            'text_main' => '#391F08',
            'text_muted' => '#673D17',
            'danger' => '#7F4F24',
            'ok' => '#687E51',
        ],
        'v2' => [
            'primary' => '#0f766e',
            'primary_contrast' => '#ecfeff',
            'surface' => '#f8fafc',
            'surface_strong' => '#ffffff',
            'text_main' => '#0f172a',
            'text_muted' => '#475569',
            'danger' => '#b91c1c',
            'ok' => '#166534',
        ],
        'v3' => [
            'primary' => '#4c7cf3',
            'primary_contrast' => '#ffffff',
            'surface' => '#f5f7fb',
            'surface_strong' => '#ffffff',
            'text_main' => '#1e293b',
            'text_muted' => '#64748b',
            'danger' => '#e11d48',
            'ok' => '#10b981',
        ],
    ];

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
        $palette = $this->getThemePalette($uiVariant);

        $config->update([
            'ui_variant' => $uiVariant,
            'colors' => $palette,
        ]);

        return $config->refresh();
    }

    private function ensureUiVariant(SiteConfig $config): SiteConfig
    {
        $palettes = $this->getThemePalettes();
        $uiVariant = $config->ui_variant;

        if (!$uiVariant || !array_key_exists($uiVariant, $palettes)) {
            $uiVariant = self::DEFAULT_UI_VARIANT;
        }

        if ($config->ui_variant === $uiVariant && $config->colors === $palettes[$uiVariant]) {
            return $config;
        }

        $config->update([
            'ui_variant' => $uiVariant,
            'colors' => $palettes[$uiVariant],
        ]);

        return $config->refresh();
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function getThemePalettes(): array
    {
        return self::THEME_PALETTES;
    }

    /**
     * @return array<string, string>
     */
    private function getThemePalette(string $uiVariant): array
    {
        $palettes = $this->getThemePalettes();

        if (!array_key_exists($uiVariant, $palettes)) {
            throw new InvalidArgumentException("Unsupported UI variant [{$uiVariant}].");
        }

        return $palettes[$uiVariant];
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultConfig(): array
    {
        return [
            'theme_name' => 'openclassy',
            'colors' => $this->getThemePalette(self::DEFAULT_UI_VARIANT),
            'ui_variant' => self::DEFAULT_UI_VARIANT,
        ];
    }
}
