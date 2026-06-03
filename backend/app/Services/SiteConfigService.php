<?php

namespace App\Services;

use App\Models\SiteConfig;
use InvalidArgumentException;

class SiteConfigService
{
    private const DEFAULT_UI_VARIANT = 'v1';

    private const DEFAULT_SITE_NAME = 'OpenClassy';

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

        return $this->ensureDefaults($config);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateConfig(array $data): SiteConfig
    {
        $config = $this->getConfig();
        $uiVariant = (string) ($data['ui_variant'] ?? $config->ui_variant ?? self::DEFAULT_UI_VARIANT);
        $payload = [
            'ui_variant' => $uiVariant,
            'colors' => $this->getThemePalette($uiVariant),
        ];

        if (array_key_exists('branding', $data)) {
            $payload['branding'] = $this->normalizeBranding($data['branding']);
        }

        $config->update($payload);

        return $config->refresh();
    }

    public function updateUiVariant(string $uiVariant): SiteConfig
    {
        return $this->updateConfig(['ui_variant' => $uiVariant]);
    }

    private function ensureDefaults(SiteConfig $config): SiteConfig
    {
        $palettes = $this->getThemePalettes();
        $uiVariant = $config->ui_variant;

        if (!$uiVariant || !array_key_exists($uiVariant, $palettes)) {
            $uiVariant = self::DEFAULT_UI_VARIANT;
        }

        $branding = $this->normalizeBranding($config->branding);

        if (
            $config->ui_variant === $uiVariant
            && $config->colors === $palettes[$uiVariant]
            && $config->branding === $branding
        ) {
            return $config;
        }

        $config->update([
            'ui_variant' => $uiVariant,
            'colors' => $palettes[$uiVariant],
            'branding' => $branding,
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
            'branding' => $this->defaultBranding(),
            'ui_variant' => self::DEFAULT_UI_VARIANT,
        ];
    }

    /**
     * @param array<string, mixed>|null $branding
     * @return array<string, string|null>
     */
    private function normalizeBranding(?array $branding): array
    {
        $siteName = trim((string) ($branding['site_name'] ?? self::DEFAULT_SITE_NAME));
        $logoType = $branding['logo_type'] ?? 'text';
        $logoType = $logoType === 'image' ? 'image' : 'text';

        return [
            'site_name' => $siteName !== '' ? $siteName : self::DEFAULT_SITE_NAME,
            'logo_type' => $logoType,
            'logo_img_url' => $this->normalizeNullableString($branding['logo_img_url'] ?? null),
            'isotype_img_url' => $this->normalizeNullableString($branding['isotype_img_url'] ?? null),
        ];
    }

    /**
     * @return array<string, string|null>
     */
    private function defaultBranding(): array
    {
        return $this->normalizeBranding(null);
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $normalized = trim($value);

        return $normalized !== '' ? $normalized : null;
    }
}
