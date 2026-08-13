<?php

use App\Auth\Auth;
use App\Auth\AuthException;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/database.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($uri === '/api/me') {
    try {
        $pdo = getDbConnection();
        $user = Auth::authenticate($pdo);
        echo json_encode(['status' => 'ok', 'user' => $user]);
    } catch (AuthException $e) {
        http_response_code($e->getStatusCode());
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($uri === '/api/health') {
    try {
        $pdo = getDbConnection();
        $pdo->query('SELECT 1');
        echo json_encode(['status' => 'ok', 'database' => 'connected']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

http_response_code(404);
echo json_encode(['status' => 'error', 'message' => 'Not found']);
