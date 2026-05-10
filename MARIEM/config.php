<?php

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
