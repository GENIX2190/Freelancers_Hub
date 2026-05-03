<?php
/**
 * Report-time content analysis (keyword / pattern — not ML).
 * Used when a user reports a post; complements ContentPolicy for submissions.
 */
class PostReportAnalyzer {

    private static function profanityWords(): array {
        return [
            'fuck', 'fucking', 'fucked', 'shit', 'bitch', 'bastard', 'asshole', 'crap',
            'damn', 'dick', 'piss', 'slut', 'whore', 'dumbass', 'jackass',
        ];
    }

    /** Multi-word profanity / insults */
    private static function profanityPhrases(): array {
        return ['fuck you', 'screw you', 'piece of shit', 'dumb shit'];
    }

    /** Harassment / fight / threat phrases */
    private static function hostilityPhrases(): array {
        return [
            'kill yourself', 'kys', 'kill you', 'i will kill', "i'll kill", 'murder you',
            'fight me', 'meet me irl', 'come find me', 'hope you die', 'drop dead',
            'hurt you', 'beat you up', 'shoot you',
        ];
    }

    /**
     * @return array{level:string,summary:string,spam_hit:bool,policy:array,toxic_count:int,...}
     */
    public static function analyze(string $text): array {
        $t = strtolower($text);
        $policy = ContentPolicy::scan($text);

        $toxicHits = [];
        foreach (self::profanityWords() as $w) {
            if ($w !== '' && preg_match('/\b' . preg_quote($w, '/') . '\b/ui', $text)) {
                $toxicHits[] = $w;
            }
        }
        foreach (self::profanityPhrases() as $p) {
            if ($p !== '' && strpos($t, $p) !== false) {
                $toxicHits[] = $p;
            }
        }
        $toxicHits = array_values(array_unique($toxicHits));

        $fightHits = [];
        foreach (self::hostilityPhrases() as $p) {
            if ($p !== '' && strpos($t, $p) !== false) {
                $fightHits[] = $p;
            }
        }

        $spamHit = !empty($policy['block']) || !empty($policy['warnings']);
        $toxicCount = count($toxicHits);
        $fightCount = count($fightHits);

        $level = 'clean';
        if (!empty($policy['block']) || $fightCount > 0) {
            $level = 'high';
        } elseif ($toxicCount > 0 || !empty($policy['warnings'])) {
            $level = 'medium';
        } elseif ($spamHit) {
            $level = 'low';
        }

        $parts = [];
        if (!empty($policy['block'])) {
            $parts[] = 'Spam/policy: ' . implode('; ', $policy['block']);
        }
        if (!empty($policy['warnings'])) {
            $parts[] = 'Warnings: ' . implode('; ', $policy['warnings']);
        }
        if ($fightCount > 0) {
            $parts[] = 'Possible threats or fight language';
        }
        if ($toxicCount > 0) {
            $parts[] = 'Strong language / insults (' . $toxicCount . ' signal' . ($toxicCount > 1 ? 's' : '') . ')';
        }
        if ($parts === []) {
            $parts[] = 'No automatic risk flags (human review still required)';
        }

        $summary = implode(' · ', $parts);

        $sum480 = function_exists('mb_substr') ? mb_substr($summary, 0, 480) : substr($summary, 0, 480);

        return [
            'level'            => $level,
            'summary'          => $sum480,
            'spam_hit'         => $spamHit,
            'policy_block'     => $policy['block'],
            'policy_warn'      => $policy['warnings'],
            'toxic_count'      => $toxicCount,
            'toxic_samples'    => array_slice($toxicHits, 0, 6),
            'hostility_hits'   => array_slice($fightHits, 0, 6),
        ];
    }
}
