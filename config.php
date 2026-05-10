<?php

/** Inactivity limit for logged-in PHP sessions (seconds). */
define('SESSION_IDLE_TIMEOUT_SEC', 600);

/** Redirect target when session idles out (relative to Controllers/). */
define('SESSION_EXPIRED_VIEW_FROM_CONTROLLERS', '../Views/users/session_expired.html');

function session_ensure_started(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * For authenticated users only: expire after SESSION_IDLE_TIMEOUT_SEC without a request;
 * otherwise refresh last activity time.
 *
 * @param bool $jsonResponse If true, respond with JSON 401 (for XHR/fetch); else HTTP redirect.
 */
function session_enforce_idle_timeout(bool $jsonResponse = false): void {
    session_ensure_started();
    if (empty($_SESSION['user_id'])) {
        return;
    }
    $now  = time();
    $last = isset($_SESSION['last_activity']) ? (int) $_SESSION['last_activity'] : $now;
    if (($now - $last) > SESSION_IDLE_TIMEOUT_SEC) {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        if ($jsonResponse) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'error'   => 'session_expired',
                'message' => 'Session expired after 10 minutes of inactivity. Please sign in again.',
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        header('Location: ' . SESSION_EXPIRED_VIEW_FROM_CONTROLLERS, true, 302);
        exit;
    }
    $_SESSION['last_activity'] = $now;
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'freelence_hub');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function getConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            throw new PDOException($e->getMessage(), (int)$e->getCode());
        }
    }
    return $pdo;
}
