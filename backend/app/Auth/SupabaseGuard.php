<?php

namespace App\Auth;

use App\Models\User;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SupabaseGuard implements Guard
{
    use GuardHelpers;

    public function __construct(private Request $request)
    {
    }

    public function user(): ?User
    {
        if ($this->user !== null) {
            return $this->user;
        }

        $token = $this->bearerToken();

        if ($token === null) {
            return null;
        }

        $claims = $this->verify($token);

        if ($claims === null) {
            return null;
        }

        $user = User::find($claims->sub);

        if ($user !== null && !$user->is_active) {
            return null;
        }

        return $this->user = $user;
    }

    public function validate(array $credentials = []): bool
    {
        return $this->user() !== null;
    }

    private function bearerToken(): ?string
    {
        $header = $this->request->header('Authorization', '');

        if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $matches)) {
            return null;
        }

        return $matches[1];
    }

    private function verify(string $token): ?object
    {
        try {
            $decoded = JWT::decode($token, $this->jwks());
        } catch (\Exception) {
            return null;
        }

        if (($decoded->aud ?? null) !== 'authenticated') {
            return null;
        }

        return $decoded;
    }

    /** @return array<string, \Firebase\JWT\Key> */
    private function jwks(): array
    {
        $jwks = Cache::remember('supabase.jwks', now()->addHour(), function () {
            $url = rtrim(config('services.supabase.url'), '/') . '/auth/v1/.well-known/jwks.json';

            return Http::timeout(5)->get($url)->throw()->json();
        });

        return JWK::parseKeySet($jwks);
    }
}
