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
            throw new PDOException($e->getMessage(), (int)$e->getCode());
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
