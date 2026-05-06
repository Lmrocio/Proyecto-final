<?php

namespace App\Http\Controllers;

use App\Http\Resources\SiteConfigResource;
use App\Http\Requests\UpdateSiteConfigRequest;
use App\Models\SiteConfig;
use App\Services\SiteConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SiteConfigController extends Controller
{
    public function __construct(private readonly SiteConfigService $siteConfigService)
    {
    }

    public function show(Request $request): JsonResponse
    {
        return $this->configResponse($request, $this->siteConfigService->getConfig());
    }

    public function update(UpdateSiteConfigRequest $request): JsonResponse
    {
        $data = $request->validated();
        $config = $this->siteConfigService->updateUiVariant($data['ui_variant']);

        return $this->configResponse($request, $config);
    }

    private function configResponse(Request $request, SiteConfig $config): JsonResponse
    {
        return response()->json([
            'config' => SiteConfigResource::make($config)->resolve($request),
        ], Response::HTTP_OK);
    }
}
