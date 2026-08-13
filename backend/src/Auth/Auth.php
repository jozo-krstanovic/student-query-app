<?php

namespace App\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\JWK;
use Firebase\JWT\Key;

class Auth
{
    /** @var array<string, Key>|null */
    private static ?array $jwks = null;

    public static function authenticate(\PDO $pdo): array
    {
        $token = self::extractBearerToken();
        $claims = self::verifyToken($token);

        $stmt = $pdo->prepare(
            'SELECT id, user_type, role_id, email, full_name, is_active FROM users WHERE id = :id'
        );
        $stmt->execute(['id' => $claims->sub]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new AuthException('User profile not found', 401);
        }

        if (!$user['is_active']) {
            throw new AuthException('User is inactive', 403);
        }

        return $user;
    }

    private static function extractBearerToken(): string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? null;

        if ($header === null && function_exists('getallheaders')) {
            $headers = getallheaders();
            $header = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }

        if ($header === null || !preg_match('/^Bearer\s+(\S+)$/i', $header, $matches)) {
            throw new AuthException('Missing or malformed Authorization header', 401);
        }

        return $matches[1];
    }

    private static function verifyToken(string $token): object
    {
        try {
            $decoded = JWT::decode($token, self::getJwks());
        } catch (\Exception $e) {
            throw new AuthException('Invalid or expired token', 401);
        }

        if (($decoded->aud ?? null) !== 'authenticated') {
            throw new AuthException('Token not valid for this audience', 401);
        }

        return $decoded;
    }

    /** @return array<string, Key> */
    private static function getJwks(): array
    {
        if (self::$jwks !== null) {
            return self::$jwks;
        }

        $url = rtrim($_ENV['SUPABASE_URL'], '/') . '/auth/v1/.well-known/jwks.json';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
        ]);
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new AuthException("Could not reach Supabase to verify token: $error", 500);
        }

        $jwks = json_decode($response, true);
        if (!is_array($jwks) || empty($jwks['keys'])) {
            throw new AuthException('Received malformed JWKS from Supabase', 500);
        }

        return self::$jwks = JWK::parseKeySet($jwks);
    }
}
