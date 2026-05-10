<?php
/**
 * Client ↔ freelancer mail via Gmail SMTP only.
 * Backup: APPLICATION_ALERTS_JSONL (one JSON line per application).
 */

use PHPMailer\PHPMailer\PHPMailer;

/**
 * @param array{mission_title?:string,mission_id?:int,mission_contact_email?:string,applicant_name?:string,applicant_email?:string,statut?:string,body_text?:string} $opts
 */
function fh_send_application_emails(array $opts): void {
    if (!APPLICATION_MAIL_ENABLED) {
        return;
    }

    fh_store_application_alert($opts);

    $clientRaw = trim((string) ($opts['mission_contact_email'] ?? ''));
    $clientTo = ($clientRaw !== '' && filter_var($clientRaw, FILTER_VALIDATE_EMAIL))
        ? $clientRaw : '';

    $applicantTo = isset($opts['applicant_email']) ? trim((string) $opts['applicant_email']) : '';
    $replyOk = filter_var($applicantTo, FILTER_VALIDATE_EMAIL);

    $missionTitle = $opts['mission_title'] ?? '—';
    $missionId = (int) ($opts['mission_id'] ?? 0);
    $name = $opts['applicant_name'] ?? '';
    $status = $opts['statut'] ?? 'Pending';
    $detail = isset($opts['body_text']) ? trim((string) $opts['body_text']) : '';

    if ($clientTo !== '') {
        $subjectClient = '[Freelence Hub] New application — ' . mb_substr($missionTitle, 0, 60);
        $bodyClient =
            "Someone applied to your mission.\r\n\r\n" .
            "Mission: {$missionTitle} (ID {$missionId})\r\n" .
            "Freelancer: {$name}\r\n" .
            "Email: {$applicantTo}\r\n" .
            "Status: {$status}\r\n\r\n" .
            "Their message:\r\n{$detail}\r\n";
        fh_dispatch_mail(
            $clientTo,
            $subjectClient,
            $bodyClient,
            $replyOk ? $name : null,
            $replyOk ? $applicantTo : null
        );
    }

    if ($clientTo === '' && $missionId > 0) {
        fh_mail_log_line('Mission ID ' . $missionId . ': no valid contact_email — client was not emailed.');
    }

    if (!$replyOk || strtolower($applicantTo) === strtolower($clientTo)) {
        return;
    }

    $subjectUser = 'Freelence Hub — application received';
    $bodyUser =
        "Hello {$name},\r\n\r\n" .
        "Thank you — we have forwarded your application for « {$missionTitle} ».\r\n" .
        "The client may reply to you at the email shown on their side.\r\n\r\n" .
        "— Freelence Hub\r\n";

    fh_dispatch_mail($applicantTo, $subjectUser, $bodyUser, null, null);
}

/**
 * Always-on backup so you still capture notification data without relying on email.
 *
 * @param array<string, mixed> $opts
 */
function fh_store_application_alert(array $opts): void {
    if (!defined('APPLICATION_ALERTS_JSONL') || APPLICATION_ALERTS_JSONL === '') {
        return;
    }
    $dir = dirname(APPLICATION_ALERTS_JSONL);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $row = [
        'at'               => date('c'),
        'mission_id'       => (int) ($opts['mission_id'] ?? 0),
        'mission_title'    => (string) ($opts['mission_title'] ?? ''),
        'client_email'     => trim((string) ($opts['mission_contact_email'] ?? '')),
        'freelancer_email' => trim((string) ($opts['applicant_email'] ?? '')),
        'freelancer_name'  => trim((string) ($opts['applicant_name'] ?? '')),
        'status'           => (string) ($opts['statut'] ?? ''),
        'message_preview'  => mb_substr(trim((string) ($opts['body_text'] ?? '')), 0, 500),
    ];
    $line = json_encode($row, JSON_UNESCAPED_UNICODE);
    if ($line !== false) {
        @file_put_contents(APPLICATION_ALERTS_JSONL, $line . "\n", FILE_APPEND | LOCK_EX);
    }
}

function fh_mail_log_line(string $line): void {
    if (!defined('MAIL_LOG_FILE') || MAIL_LOG_FILE === '') {
        return;
    }
    $dir = dirname(MAIL_LOG_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    @file_put_contents(MAIL_LOG_FILE, date('[Y-m-d H:i:s] ') . $line . "\n", FILE_APPEND | LOCK_EX);
}

function fh_mail_autoload(): bool {
    static $loaded = null;
    if ($loaded !== null) {
        return $loaded;
    }
    $autoload = __DIR__ . '/vendor/autoload.php';
    $loaded = is_readable($autoload);
    if ($loaded) {
        require_once $autoload;
    }
    return $loaded;
}

function fh_smtp_configured(): bool {
    return trim((string) MAIL_SMTP_HOST) !== ''
        && trim((string) MAIL_SMTP_USER) !== ''
        && trim((string) MAIL_SMTP_PASS) !== '';
}

/** @return array{0:string,1:string} */
function fh_parse_mail_from(string $from): array {
    if (preg_match('/^\s*(.+?)\s*<([^>]+)>\s*$/u', $from, $m)) {
        return [trim($m[1], " \t\"'"), trim($m[2])];
    }
    $t = trim($from);
    if (filter_var($t, FILTER_VALIDATE_EMAIL)) {
        return ['', $t];
    }
    return ['Freelence Hub', ''];
}

/**
 * @param ?string $replyName
 * @param ?string $replyEmail
 */
function fh_send_via_phpmailer(string $to, string $subject, string $body, $replyName, $replyEmail, ?string &$errFilled = null): bool {
    $errFilled = null;
    $mail = null;

    try {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = MAIL_SMTP_HOST;
        $mail->Port = (int) MAIL_SMTP_PORT;
        $mail->SMTPAuth = true;
        $mail->Username = MAIL_SMTP_USER;
        $mail->Password = MAIL_SMTP_PASS;
        $mail->SMTPTimeout = 35;

        $enc = strtolower(trim((string) MAIL_SMTP_ENCRYPTION));
        if ($enc === 'tls') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } elseif ($enc === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPAutoTLS = false;
        }

        if (defined('MAIL_RELAX_TLS_VERIFY') && MAIL_RELAX_TLS_VERIFY) {
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer'        => false,
                    'verify_peer_name'   => false,
                    'allow_self_signed'  => true,
                ],
            ];
        }

        $mail->CharSet = PHPMailer::CHARSET_UTF8;

        [$fromName, $parsedEmail] = fh_parse_mail_from(APPLICATION_MAIL_FROM);
        if ($fromName === '') {
            $fromName = 'Freelence Hub';
        }
        /** Gmail: authenticated user must match envelope From when using that account */
        $envelopeFrom = MAIL_SMTP_USER;
        if (filter_var($parsedEmail, FILTER_VALIDATE_EMAIL)
            && strcasecmp((string) $parsedEmail, (string) MAIL_SMTP_USER) === 0) {
            $envelopeFrom = $parsedEmail;
        }

        $mail->setFrom($envelopeFrom, $fromName);
        $mail->addAddress($to);

        if ($replyEmail !== null && $replyEmail !== '' && filter_var($replyEmail, FILTER_VALIDATE_EMAIL)) {
            $mail->addReplyTo($replyEmail, (string) $replyName);
        }

        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->isHTML(false);

        return $mail->send();
    } catch (Throwable $e) {
        $msg = $e->getMessage();
        $info = '';
        try {
            if ($mail instanceof PHPMailer && $mail->ErrorInfo !== '') {
                $info = ' | ' . $mail->ErrorInfo;
            }
        } catch (Throwable $_) {
        }
        $full = $msg . $info;
        $errFilled = $full;
        fh_mail_log_line('SMTP: ' . $full);
        error_log('[Freelence Hub] SMTP: ' . $full);
        return false;
    }
}

/**
 * @param ?string $replyName
 * @param ?string $replyEmail
 */
function fh_dispatch_mail(string $to, string $subject, string $body, $replyName, $replyEmail): void {
    $unused = null;

    if (!fh_mail_autoload()) {
        fh_mail_log_line('PHPMailer autoload missing: Controllers/notification-e/vendor/autoload.php');
        return;
    }

    if (!fh_smtp_configured()) {
        static $once;
        if (!$once) {
            fh_mail_log_line(
                'Gmail SMTP inactive — set MAIL_SMTP_USER + MAIL_SMTP_PASS (App Password after 2-Step Verification) in config.php'
            );
            $once = true;
        }
        return;
    }

    if (!fh_send_via_phpmailer($to, $subject, $body, $replyName, $replyEmail, $unused)) {
        fh_mail_log_line('Failed to reach ' . $to . ' — see SMTP error lines above.');
    }
}
