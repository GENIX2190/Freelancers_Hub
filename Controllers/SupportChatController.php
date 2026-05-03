<?php
/**
 * JSON API for the Experience page support widget.
 * Calls an OpenAI-compatible Chat Completions endpoint; key stays on the server.
 *
 * Configure in Controllers/config.local.php — OpenAI OR any OpenAI-compatible API (e.g. Groq free tier).
 */
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/ContentPolicy.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$now = time();
$winStart = $_SESSION['support_chat_window_start'] ?? 0;
if ($now - $winStart > 3600) {
    $_SESSION['support_chat_window_start'] = $now;
    $_SESSION['support_chat_hits'] = 0;
}
$_SESSION['support_chat_hits'] = ($_SESSION['support_chat_hits'] ?? 0) + 1;
if ($_SESSION['support_chat_hits'] > 50) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'rate_limit', 'reply' => 'Too many messages. Try again in a little while.']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json']);
    exit;
}

$message = isset($data['message']) ? trim((string)$data['message']) : '';
$history = isset($data['history']) && is_array($data['history']) ? $data['history'] : [];

if ($message === '' || strlen($message) > 2000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_message']);
    exit;
}

$scan = ContentPolicy::scan($message);
if ($scan['blocked']) {
    http_response_code(400);
    echo json_encode([
        'ok'     => false,
        'error'  => 'policy',
        'reason' => ContentPolicy::firstBlockReason($scan),
    ]);
    exit;
}

$apiKey = OPENAI_API_KEY;
if ($apiKey === '') {
    echo json_encode([
        'ok'      => true,
        'offline' => true,
        'reply'   => '',
        'hint'    => 'no_api_key',
    ]);
    exit;
}

$system = <<<PROMPT
You are the support assistant for "Freelence Hub", a freelancer community website.

Your job:
- Reply naturally to greetings and casual messages (e.g. "hi", "how are you") with a short friendly line, then invite them to ask about the site.
- Explain clearly how to use the Experience section: sharing stories ("Share Your Story"), reading posts, replying to posts, and that text is checked for spam/policy (keyword rules).
- Answer questions about community rules in general terms: no scams, no harassment, no mass link spam.
- If the user needs account access, billing, legal issues, or anything sensitive, tell them to email support@freelencehub.example and do not invent policies or guarantees.
- Keep answers short (2–5 sentences) unless the user asks for detail. Use plain language.
- Vary your wording; avoid repeating the same stock closing every time.
- Do not pretend you can access their account or database. Do not invent product features that are not described above.
PROMPT;

$messages = [['role' => 'system', 'content' => $system]];

$slice = array_slice($history, -10);
foreach ($slice as $h) {
    if (!is_array($h)) {
        continue;
    }
    $role = $h['role'] ?? '';
    $content = isset($h['content']) ? (string)$h['content'] : '';
    if (($role === 'user' || $role === 'assistant') && $content !== '') {
        $messages[] = ['role' => $role, 'content' => substr($content, 0, 2000)];
    }
}

$messages[] = ['role' => 'user', 'content' => $message];

$payload = json_encode([
    'model'       => OPENAI_CHAT_MODEL,
    'messages'    => $messages,
    'max_tokens'  => 500,
    'temperature' => 0.45,
]);

$base = rtrim(OPENAI_API_BASE, '/');
$url  = $base . '/chat/completions';

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey,
];

$responseBody = '';
$statusCode   = 0;
$curlErr      = '';

/**
 * Extract a safe short message from OpenAI-style error JSON.
 */
$openaiErrMsg = static function ($body) {
    if ($body === '' || !is_string($body)) {
        return '';
    }
    $j = json_decode($body, true);
    if (!is_array($j)) {
        return '';
    }
    if (isset($j['error']['message']) && is_string($j['error']['message'])) {
        return substr(trim($j['error']['message']), 0, 220);
    }
    return '';
};

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 60,
    ]);
    $responseBody = curl_exec($ch);
    $statusCode   = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($responseBody === false) {
        $curlErr = (string)curl_error($ch);
    }
    curl_close($ch);
} else {
    $ctx = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => implode("\r\n", $headers),
            'content'       => $payload,
            'timeout'       => 60,
            'ignore_errors' => true,
        ],
    ]);
    $responseBody = @file_get_contents($url, false, $ctx);
    if (isset($http_response_header[0]) && preg_match('/HTTP\/\S+\s+(\d+)/', $http_response_header[0], $m)) {
        $statusCode = (int)$m[1];
    }
}

$apiDetail = $openaiErrMsg((string)$responseBody);
if ($curlErr !== '') {
    $apiDetail = $apiDetail ?: ('Connection error: ' . substr($curlErr, 0, 150));
}

if ($statusCode !== 200 || $responseBody === false || $responseBody === '') {
    http_response_code(502);
    echo json_encode([
        'ok'     => false,
        'error'  => 'ai_unavailable',
        'reply'  => '',
        'detail' => $apiDetail,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$json = json_decode($responseBody, true);
if (is_array($json) && isset($json['error'])) {
    http_response_code(502);
    echo json_encode([
        'ok'     => false,
        'error'  => 'ai_unavailable',
        'reply'  => '',
        'detail' => $apiDetail ?: 'The AI service returned an error.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$text = '';
if (is_array($json) && isset($json['choices'][0]['message']['content'])) {
    $text = trim((string)$json['choices'][0]['message']['content']);
}

if ($text === '') {
    http_response_code(502);
    echo json_encode([
        'ok'     => false,
        'error'  => 'empty_ai_response',
        'detail' => $apiDetail ?: 'Empty reply from model.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true, 'reply' => $text, 'offline' => false], JSON_UNESCAPED_UNICODE);
