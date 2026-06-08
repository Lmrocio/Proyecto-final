<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSiteConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ui_variant' => ['required', 'string', 'in:v1,v2,v3'],
            'branding' => ['sometimes', 'array'],
            'branding.site_name' => ['required_with:branding', 'string', 'max:120'],
            'branding.logo_type' => ['required_with:branding', 'string', 'in:text,image'],
            'branding.logo_img_url' => ['nullable', 'string'],
            'branding.isotype_img_url' => ['nullable', 'string'],
        ];
    }
}
