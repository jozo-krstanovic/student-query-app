<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SupabaseStorage
{
    public function upload(string $path, string $contents, string $mimeType): void
    {
        Http::withHeaders($this->authHeaders() + ['Content-Type' => $mimeType])
            ->withBody($contents, $mimeType)
            ->timeout(10)
            ->post("{$this->objectUrl()}/{$path}")
            ->throw();
    }

    public function signedUrl(string $path, int $expiresIn = 300): string
    {
        $response = Http::withHeaders($this->authHeaders())
            ->timeout(10)
            ->post("{$this->baseUrl()}/storage/v1/object/sign/{$this->bucket()}/{$path}", [
                'expiresIn' => $expiresIn,
            ])
            ->throw()
            ->json();

        // Supabase returns signedURL relative to /storage/v1, e.g.
        // "/object/sign/bucket/path?token=..." -- not a full path from the
        // project root, so that prefix has to be added back here.
        return "{$this->baseUrl()}/storage/v1{$response['signedURL']}";
    }

    public function delete(string $path): void
    {
        Http::withHeaders($this->authHeaders())
            ->timeout(10)
            ->delete("{$this->objectUrl()}/{$path}")
            ->throw();
    }

    private function authHeaders(): array
    {
        $key = config('services.supabase.service_role_key');

        return [
            'Authorization' => "Bearer {$key}",
            'apikey' => $key,
        ];
    }

    private function objectUrl(): string
    {
        return "{$this->baseUrl()}/storage/v1/object/{$this->bucket()}";
    }

    private function baseUrl(): string
    {
        return rtrim(config('services.supabase.url'), '/');
    }

    private function bucket(): string
    {
        return config('services.supabase.storage_bucket');
    }
}
