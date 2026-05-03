<?php
/**
 * Lightweight spam & policy scan (keyword / pattern based — not ML).
 * Keep in sync with Views/experience/js/content-policy.js
 */
class ContentPolicy {

    /** Hard block: obvious scam / spam / policy violations */
    private static function blockPhrases(): array {
        return [
            'viagra', 'cialis', 'online pharmacy',
            'casino bonus', 'online casino', 'poker chips',
            'lottery winner', 'claim your prize', 'you have won $',
            'double your bitcoin', 'crypto doubler', 'send crypto',
            'western union', 'wire transfer fee', 'gift card scam',
            'nigerian prince', 'million dollars inheritance',
            'click here now', 'limited time offer!!!',
            'work from home earning $', 'guaranteed income $',
            'buy followers cheap', 'buy subscribers',
        ];
    }

    /** Softer warnings (still post in demo; server can treat as block if you tighten) */
    private static function warnPhrases(): array {
        return [
            'whatsapp me', 'telegram @', 'dm me on instagram',
            'click my link', 'use this referral',
        ];
    }

    public static function scan(string $text): array {
        $t = strtolower($text);
        $blockReasons = [];
        $warnReasons = [];

        foreach (self::blockPhrases() as $p) {
            if ($p !== '' && strpos($t, $p) !== false) {
                $blockReasons[] = 'Content matches blocked spam or policy phrases.';
                break;
            }
        }

        if (preg_match('/\b(kill\s+yourself|kys)\b/u', $t)) {
            $blockReasons[] = 'Harmful content is not allowed.';
        }

        // Repeated URL spam
        if (preg_match_all('/https?:\/\/\S+/i', $text, $m) && count($m[0]) >= 6) {
            $blockReasons[] = 'Too many links — looks like spam.';
        }

        foreach (self::warnPhrases() as $p) {
            if ($p !== '' && strpos($t, $p) !== false) {
                $warnReasons[] = 'Off-site contact or promo patterns detected.';
                break;
            }
        }

        $blocked = count($blockReasons) > 0;

        return [
            'allowed'   => !$blocked,
            'blocked'   => $blocked,
            'block'     => $blockReasons,
            'warnings'  => $warnReasons,
        ];
    }

    /** One-line for redirects / logs */
    public static function firstBlockReason(array $result): string {
        if (!empty($result['block'][0])) {
            return $result['block'][0];
        }
        return 'Content not allowed.';
    }
}
