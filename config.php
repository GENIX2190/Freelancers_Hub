<?php
/**
 * Main app config + getConnection()
 * Project root: config.php
 * Optional secrets: Controllers/config.local.php (gitignored)
 * MVC: Controllers/, Models/, Views/
 */
if (is_readable(__DIR__ . '/Controllers/config.local.php')) {
    require_once __DIR__ . '/Controllers/config.local.php';
}

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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIL — Gmail SMTP only (PHPMailer: Controllers/notification-e/vendor/)
   Flow: freelancer applies → client (`contact_email`) + freelancer confirmation.

   Also writes each application to APPLICATION_ALERTS_JSONL (backup if SMTP fails).
═══════════════════════════════════════════════════════════════════════════ */

define('APPLICATION_MAIL_ENABLED', true);

/**
 * Display name + From mailbox. The mailbox must be the same as MAIL_SMTP_USER
 * (Gmail requires the authenticated account to own the From address).
 */
define('APPLICATION_MAIL_FROM', 'Freelence Hub <your@gmail.com>');

define('MAIL_SMTP_HOST', 'smtp.gmail.com');
define('MAIL_SMTP_PORT', 587);
define('MAIL_SMTP_USER', 'mohamedothmenbentlili@gmail.com');
define('MAIL_SMTP_PASS', 'rcrv ajrf merh umrg');
define('MAIL_SMTP_ENCRYPTION', 'tls');
define('MAIL_RELAX_TLS_VERIFY', true);

/** SMTP debug / errors */
define('MAIL_LOG_FILE', dirname(__FILE__) . '/logs/application-mail.log');

/**
 * One JSON object per line — every application is recorded here (read with any editor
 * or `tail -f logs/application-alerts.jsonl`) even if Gmail fails.
 */
define('APPLICATION_ALERTS_JSONL', dirname(__FILE__) . '/logs/application-alerts.jsonl');

/* ═══════════════════════════════════════════════════════════════════════════
   DATABASE
═══════════════════════════════════════════════════════════════════════════ */

define('DB_HOST', 'localhost');
define('DB_NAME', 'freelence_hub');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function getConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            throw new PDOException($e->getMessage(), (int) $e->getCode());
        }
    }
    return $pdo;
}

/*
 * AI support chat — any OpenAI-compatible endpoint (same JSON shape as /v1/chat/completions).
 * - OpenAI: paid after free credit → https://platform.openai.com/api-keys
 * - Groq: free tier for dev → https://console.groq.com/keys (set base + model in Controllers/config.local.php)
 */
if (!defined('OPENAI_API_KEY')) {
    define('OPENAI_API_KEY', (string)(getenv('OPENAI_API_KEY') ?: ''));
}
if (!defined('OPENAI_CHAT_MODEL')) {
    define('OPENAI_CHAT_MODEL', 'gpt-4o-mini');
}
if (!defined('OPENAI_API_BASE')) {
    define('OPENAI_API_BASE', 'https://api.openai.com/v1');
}

/** Google reCAPTCHA v2 (checkbox) — login / register. Override via getenv or Controllers/config.local.php */
if (!defined('RECAPTCHA_SITE_KEY')) {
    define('RECAPTCHA_SITE_KEY', (string) (getenv('RECAPTCHA_SITE_KEY') ?: '6LffMGcUAAAAABRJmPd1mUqhxUg7w5iktOIsbgMI'));
}
if (!defined('RECAPTCHA_SECRET_KEY')) {
    define('RECAPTCHA_SECRET_KEY', (string) (getenv('RECAPTCHA_SECRET_KEY') ?: '6LffMGcUAAAAACw-0oBJ13czW1dsl_0HbXbxEVUY'));
}
