/**
 * Client-side mirror of Models/ContentPolicy.php — keep phrase lists aligned.
 * Returns { allowed, blocked, block[], warnings[] }
 */
(function (global) {
    var BLOCK = [
        'viagra', 'cialis', 'online pharmacy',
        'casino bonus', 'online casino', 'poker chips',
        'lottery winner', 'claim your prize', 'you have won $',
        'double your bitcoin', 'crypto doubler', 'send crypto',
        'western union', 'wire transfer fee', 'gift card scam',
        'nigerian prince', 'million dollars inheritance',
        'click here now', 'limited time offer!!!',
        'work from home earning $', 'guaranteed income $',
        'buy followers cheap', 'buy subscribers'
    ];

    var WARN = [
        'whatsapp me', 'telegram @', 'dm me on instagram',
        'click my link', 'use this referral'
    ];

    function scan(text) {
        var t = (text || '').toLowerCase();
        var block = [];
        var warnings = [];

        for (var i = 0; i < BLOCK.length; i++) {
            if (BLOCK[i] && t.indexOf(BLOCK[i]) !== -1) {
                block.push('Content matches blocked spam or policy phrases.');
                break;
            }
        }

        if (/\b(kill\s+yourself|kys)\b/i.test(t)) {
            block.push('Harmful content is not allowed.');
        }

        var urls = t.match(/https?:\/\/\S+/gi);
        if (urls && urls.length >= 6) {
            block.push('Too many links — looks like spam.');
        }

        for (var j = 0; j < WARN.length; j++) {
            if (WARN[j] && t.indexOf(WARN[j]) !== -1) {
                warnings.push('Off-site contact or promo patterns detected.');
                break;
            }
        }

        var blocked = block.length > 0;
        return {
            allowed: !blocked,
            blocked: blocked,
            block: block,
            warnings: warnings
        };
    }

    global.ContentPolicy = { scan: scan };
})(typeof window !== 'undefined' ? window : this);
