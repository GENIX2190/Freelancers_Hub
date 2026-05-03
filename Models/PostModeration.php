<?php
/**
 * Auto-moderation: decide if a post (title + body + meta) must be removed or blocked.
 * Aligns with ContentPolicy + PostReportAnalyzer (not ML).
 */
class PostModeration {

    /**
     * True if this text bundle should not stay published (spam/policy block, profanity, threats, etc.).
     */
    public static function mustDelete(string $bundle): bool {
        $policy = ContentPolicy::scan($bundle);
        if (!empty($policy['block'])) {
            return true;
        }
        $a = PostReportAnalyzer::analyze($bundle);
        return in_array($a['level'], ['high', 'medium'], true);
    }
}
