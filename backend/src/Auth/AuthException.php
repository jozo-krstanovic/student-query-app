<?php

namespace App\Auth;

class AuthException extends \RuntimeException
{
    public function __construct(string $message, private int $statusCode = 401)
    {
        parent::__construct($message);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
