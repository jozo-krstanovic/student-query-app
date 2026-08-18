<?php

return [

    // broadcasting/auth lives outside api/* (registered directly by
    // Broadcast::routes() in routes/channels.php), but Echo's private-channel
    // authorizer calls it cross-origin from the frontend just like every
    // api/* route, so it needs the same CORS treatment.
    'paths' => ['api/*', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Bearer-token auth, not cookies -- no credentials needed cross-origin.
    'supports_credentials' => false,

];
