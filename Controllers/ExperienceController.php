<?php
/**
 * Module Experience / blog (post, reponse) — one controller file.
 */
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Experience.php';
require_once dirname(__DIR__) . '/Models/ContentPolicy.php';
require_once dirname(__DIR__) . '/Models/PostReportAnalyzer.php';
require_once dirname(__DIR__) . '/Models/PostModeration.php';

class ExperienceController {

    private $pdo;

    public function __construct() {
        $this->pdo = getConnection();
    }

    public function index() {
        return $this->listPost();
    }

    public function listPost() {
        $stmt = $this->pdo->query("SELECT * FROM post ORDER BY date_publication DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPost($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM post WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createPost($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO post (user_id, titre, contenu, categorie, tags, date_publication, statut)
             VALUES (?, ?, ?, ?, ?, NOW(), ?)"
        );
        $stmt->execute([
            $data['user_id'],
            $data['titre'],
            $data['contenu'],
            $data['categorie'] ?? null,
            $data['tags'] ?? null,
            $data['statut'] ?? 'brouillon'
        ]);
        return $this->pdo->lastInsertId();
    }

    public function updatePost($id, $data) {
        $stmt = $this->pdo->prepare(
            "UPDATE post SET titre=?, contenu=?, categorie=?, tags=?, statut=? WHERE id=?"
        );
        return $stmt->execute([
            $data['titre'],
            $data['contenu'],
            $data['categorie'] ?? null,
            $data['tags'] ?? null,
            $data['statut'],
            $id
        ]);
    }

    public function deletePost($id) {
        try {
            $this->pdo->prepare('DELETE FROM post_reaction WHERE post_id = ?')->execute([(int)$id]);
        } catch (PDOException $e) {
            // table may not exist yet
        }
        $stmt = $this->pdo->prepare("DELETE FROM post WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function ensurePostReactionTable(): void {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS post_reaction (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            reaction VARCHAR(16) NOT NULL,
            visitor_key VARCHAR(64) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_post_visitor (post_id, visitor_key),
            KEY idx_post (post_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    /** @param int[] $postIds @return array<int, array{counts: array<string,int>, mine: ?string}> */
    public function getReactionsForPosts(array $postIds, ?string $visitorKey): array {
        $this->ensurePostReactionTable();
        $empty = ['like' => 0, 'love' => 0, 'haha' => 0, 'sad' => 0, 'thanks' => 0];
        $out   = [];
        $postIds = array_values(array_unique(array_filter(array_map('intval', $postIds))));
        foreach ($postIds as $pid) {
            $out[$pid] = ['counts' => $empty, 'mine' => null];
        }
        if ($postIds === []) {
            return $out;
        }
        $in = implode(',', $postIds);
        $q  = $this->pdo->query(
            "SELECT post_id, reaction, COUNT(*) AS c FROM post_reaction WHERE post_id IN ($in) GROUP BY post_id, reaction"
        );
        $allowed = array_keys($empty);
        foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $pid = (int)$row['post_id'];
            $r   = $row['reaction'];
            if (!isset($out[$pid]) || !in_array($r, $allowed, true)) {
                continue;
            }
            $out[$pid]['counts'][$r] = (int)$row['c'];
        }
        if ($visitorKey !== null && $visitorKey !== '') {
            $vk = preg_replace('/[^a-zA-Z0-9_-]/', '', $visitorKey);
            if (strlen($vk) >= 8 && strlen($vk) <= 64) {
                $st = $this->pdo->prepare(
                    "SELECT post_id, reaction FROM post_reaction WHERE visitor_key = ? AND post_id IN ($in)"
                );
                $st->execute([$vk]);
                while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                    $pid = (int)$row['post_id'];
                    if (isset($out[$pid]) && in_array($row['reaction'], $allowed, true)) {
                        $out[$pid]['mine'] = $row['reaction'];
                    }
                }
            }
        }
        return $out;
    }

    /** @return array{ok:bool, err?:string, counts?:array, mine?:?string} */
    public function setPostReaction(int $postId, string $visitorKey, string $reaction): array {
        $allowed = ['like', 'love', 'haha', 'sad', 'thanks'];
        if (!in_array($reaction, $allowed, true)) {
            return ['ok' => false, 'err' => 'bad_reaction'];
        }
        $this->ensurePostReactionTable();
        if (!$this->getPost($postId)) {
            return ['ok' => false, 'err' => 'no_post'];
        }
        $vk = preg_replace('/[^a-zA-Z0-9_-]/', '', $visitorKey);
        if (strlen($vk) < 8 || strlen($vk) > 64) {
            return ['ok' => false, 'err' => 'bad_key'];
        }
        $stmt = $this->pdo->prepare('SELECT reaction FROM post_reaction WHERE post_id = ? AND visitor_key = ?');
        $stmt->execute([$postId, $vk]);
        $cur = $stmt->fetchColumn();
        if ($cur !== false && (string)$cur === $reaction) {
            $this->pdo->prepare('DELETE FROM post_reaction WHERE post_id = ? AND visitor_key = ?')->execute([$postId, $vk]);
        } else {
            $ins = $this->pdo->prepare(
                'INSERT INTO post_reaction (post_id, visitor_key, reaction) VALUES (?,?,?)
                 ON DUPLICATE KEY UPDATE reaction = VALUES(reaction)'
            );
            $ins->execute([$postId, $vk, $reaction]);
        }
        $agg = $this->getReactionsForPosts([$postId], $vk);
        $blk = $agg[$postId] ?? ['counts' => ['like' => 0, 'love' => 0, 'haha' => 0, 'sad' => 0, 'thanks' => 0], 'mine' => null];
        return array_merge(['ok' => true], $blk);
    }

    public function listReponse() {
        $stmt = $this->pdo->query("SELECT * FROM reponse ORDER BY date_reponse DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getReponse($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM reponse WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createReponse($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO reponse (post_id, nom, email, contenu, date_reponse)
             VALUES (?, ?, ?, ?, NOW())"
        );
        $stmt->execute([
            $data['post_id'],
            $data['nom'],
            $data['email'],
            $data['contenu'],
        ]);
        return $this->pdo->lastInsertId();
    }

    public function updateReponse($id, $data) {
        $stmt = $this->pdo->prepare(
            "UPDATE reponse SET post_id=?, nom=?, email=?, contenu=? WHERE id=?"
        );
        return $stmt->execute([
            $data['post_id'],
            $data['nom'],
            $data['email'],
            $data['contenu'],
            $id,
        ]);
    }

    public function deleteReponse($id) {
        $stmt = $this->pdo->prepare("DELETE FROM reponse WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function listReponseWithPost() {
        $stmt = $this->pdo->query(
            "SELECT r.*, p.titre AS post_titre
             FROM reponse r
                JOIN post p ON p.id = r.post_id
             ORDER BY r.date_reponse DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Delete posts (and their replies) that match spam / policy / toxic auto-moderation rules.
     */
    public function purgeNonCompliantPosts(): int {
        $rows = $this->pdo->query('SELECT id, titre, contenu, categorie, tags FROM post')->fetchAll(PDO::FETCH_ASSOC);
        $ids  = [];
        foreach ($rows as $r) {
            $m = Post::unpackContenu($r['contenu']);
            $bundle = ($r['titre'] ?? '') . "\n" . ($m['content'] ?? '') . "\n" . ($m['author'] ?? '')
                . "\n" . ($r['tags'] ?? '') . "\n" . ($r['categorie'] ?? '');
            if (PostModeration::mustDelete($bundle)) {
                $ids[] = (int)$r['id'];
            }
        }
        if ($ids === []) {
            return 0;
        }
        $ids = array_values(array_unique($ids));
        $in  = implode(',', $ids);
        try {
            $this->pdo->exec('DELETE FROM post_report WHERE post_id IN (' . $in . ')');
        } catch (PDOException $e) {
            // post_report table may not exist
        }
        try {
            $this->pdo->exec('DELETE FROM post_reaction WHERE post_id IN (' . $in . ')');
        } catch (PDOException $e) {
            // post_reaction table may not exist
        }
        $this->pdo->exec('DELETE FROM reponse WHERE post_id IN (' . $in . ')');
        $this->pdo->exec('DELETE FROM post WHERE id IN (' . $in . ')');
        return count($ids);
    }

    /**
     * Delete individual replies whose text matches spam / policy / toxic rules.
     */
    public function purgeNonCompliantReplies(): int {
        $rows = $this->pdo->query('SELECT id, nom, email, contenu FROM reponse')->fetchAll(PDO::FETCH_ASSOC);
        $ids  = [];
        foreach ($rows as $r) {
            $bundle = ($r['nom'] ?? '') . "\n" . ($r['email'] ?? '') . "\n" . ($r['contenu'] ?? '');
            if (PostModeration::mustDelete($bundle)) {
                $ids[] = (int)$r['id'];
            }
        }
        if ($ids === []) {
            return 0;
        }
        $ids = array_values(array_unique($ids));
        $in  = implode(',', $ids);
        $this->pdo->exec('DELETE FROM reponse WHERE id IN (' . $in . ')');
        return count($ids);
    }

    /** Run before listing JSON so feeds and DB stay aligned. */
    public function purgeNonCompliantContent(): void {
        $this->purgeNonCompliantPosts();
        $this->purgeNonCompliantReplies();
    }
}

/* ═══════════════════════════════════════════
   HTTP HANDLERS — GET JSON + POST CRUD
   ═══════════════════════════════════════════ */
$dash = '../Views/experience/dashboard.html';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'list_posts') {
        $c = new ExperienceController();
        $c->purgeNonCompliantContent();
        $rows = $c->listPost();
        $ids  = array_map(static function ($r) { return (int)$r['id']; }, $rows);
        $react = $c->getReactionsForPosts($ids, $_GET['visitor_key'] ?? null);
        $out  = [];
        foreach ($rows as $r) {
            $m = Post::unpackContenu($r['contenu']);
            $pid = (int)$r['id'];
            $out[] = [
                'id'        => $pid,
                'title'     => $r['titre'],
                'category'  => $r['categorie'] ?? '',
                'author'    => $m['author'],
                'status'    => Post::dbStatusToUi($r['statut']),
                'date'      => substr($r['date_publication'], 0, 10),
                'tags'      => $r['tags'] ?? '',
                'content'   => $m['content'],
                'reactions' => $react[$pid] ?? ['counts' => ['like' => 0, 'love' => 0, 'haha' => 0, 'sad' => 0, 'thanks' => 0], 'mine' => null],
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($out);
        exit;
    }

    if ($action === 'list_replies') {
        $c = new ExperienceController();
        $c->purgeNonCompliantContent();
        $rows = $c->listReponseWithPost();
        $out  = [];
        foreach ($rows as $r) {
            $out[] = [
                'id'        => (int)$r['id'],
                'postId'    => (int)$r['post_id'],
                'postTitle' => $r['post_titre'] ?? '—',
                'author'    => $r['nom'],
                'email'     => $r['email'],
                'content'   => $r['contenu'],
                'date'      => substr($r['date_reponse'], 0, 10),
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($out);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fa = $_POST['form_action'] ?? '';
    $c  = new ExperienceController();

    if (session_status() === PHP_SESSION_NONE) session_start();
    $uid = $_SESSION['user_id'] ?? null;
    if (!$uid) {
        $pdo = getConnection();
        $row = $pdo->query("SELECT id FROM utilisateur ORDER BY id LIMIT 1")->fetch();
        $uid = $row ? $row['id'] : 1;
    }

    /* ── POST CREATE ── */
    if ($fa === 'post_create') {
        $policyBundle = ($_POST['title'] ?? '') . "\n" . ($_POST['content'] ?? '') . "\n" . ($_POST['tags'] ?? '')
            . "\n" . ($_POST['author'] ?? '') . "\n" . ($_POST['category'] ?? '');
        $policy = ContentPolicy::scan($policyBundle);
        if ($policy['blocked']) {
            $reason = ContentPolicy::firstBlockReason($policy);
            $redirect = $_POST['redirect'] ?? '';
            if ($redirect === 'view') {
                header('Location: ../Views/experience/view.html?msg=policy_block&reason=' . rawurlencode($reason));
            } else {
                header('Location: ' . $dash . '?msg=policy_block&reason=' . rawurlencode($reason));
            }
            exit;
        }
        if (PostModeration::mustDelete($policyBundle)) {
            $redirect = $_POST['redirect'] ?? '';
            if ($redirect === 'view') {
                header('Location: ../Views/experience/view.html?msg=post_moderated');
            } else {
                header('Location: ' . $dash . '?msg=post_moderated');
            }
            exit;
        }
        $packed = Post::packContenu($_POST['author'] ?? '', $_POST['content'] ?? '');
        try {
            $c->createPost([
                'user_id'   => (int)$uid,
                'titre'     => $_POST['title'] ?? '',
                'contenu'   => $packed,
                'categorie' => $_POST['category'] ?? null,
                'tags'      => $_POST['tags'] ?? null,
                'statut'    => Post::uiStatusToDb($_POST['status'] ?? 'Draft'),
            ]);
            $redirect = $_POST['redirect'] ?? '';
            if ($redirect === 'view') {
                header('Location: ../Views/experience/view.html?msg=post_created');
            } else {
                header('Location: ' . $dash . '?msg=post_created');
            }
        } catch (PDOException $e) {
            $redirect = $_POST['redirect'] ?? '';
            if ($redirect === 'view') {
                header('Location: ../Views/experience/view.html?msg=post_error&err=' . urlencode($e->getMessage()));
            } else {
                header('Location: ' . $dash . '?msg=post_error&err=' . urlencode($e->getMessage()));
            }
        }
        exit;
    }

    /* ── POST UPDATE ── */
    if ($fa === 'post_update') {
        $id = (int)($_POST['post_id'] ?? 0);
        $policyBundle = ($_POST['title'] ?? '') . "\n" . ($_POST['content'] ?? '') . "\n" . ($_POST['tags'] ?? '')
            . "\n" . ($_POST['author'] ?? '') . "\n" . ($_POST['category'] ?? '');
        $policy = ContentPolicy::scan($policyBundle);
        if ($policy['blocked']) {
            header('Location: ' . $dash . '?msg=policy_block&reason=' . rawurlencode(ContentPolicy::firstBlockReason($policy)));
            exit;
        }
        if (PostModeration::mustDelete($policyBundle)) {
            header('Location: ' . $dash . '?msg=post_moderated');
            exit;
        }
        $packed = Post::packContenu($_POST['author'] ?? '', $_POST['content'] ?? '');
        try {
            $c->updatePost($id, [
                'titre'     => $_POST['title'] ?? '',
                'contenu'   => $packed,
                'categorie' => $_POST['category'] ?? null,
                'tags'      => $_POST['tags'] ?? null,
                'statut'    => Post::uiStatusToDb($_POST['status'] ?? 'Draft'),
            ]);
            header('Location: ' . $dash . '?msg=post_updated');
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=post_error&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    /* ── POST DELETE ── */
    if ($fa === 'post_delete') {
        $id = (int)($_POST['post_id'] ?? 0);
        $c->deletePost($id);
        header('Location: ' . $dash . '?msg=post_deleted');
        exit;
    }

    /* ── POST REACTION (AJAX JSON) ── */
    if ($fa === 'post_reaction') {
        header('Content-Type: application/json; charset=utf-8');
        $postId   = (int)($_POST['post_id'] ?? 0);
        $reaction = trim((string)($_POST['reaction'] ?? ''));
        $visitor  = (string)($_POST['visitor_key'] ?? '');
        $result   = $c->setPostReaction($postId, $visitor, $reaction);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /* ── REPLY CREATE ── */
    if ($fa === 'reply_create') {
        $policyBundle = ($_POST['author'] ?? '') . "\n" . ($_POST['email'] ?? '') . "\n" . ($_POST['content'] ?? '');
        $policy = ContentPolicy::scan($policyBundle);
        if ($policy['blocked']) {
            $reason = ContentPolicy::firstBlockReason($policy);
            $redirect = $_POST['redirect'] ?? '';
            if ($redirect === 'view') {
                header('Location: ../Views/experience/view.html?msg=policy_block&reason=' . rawurlencode($reason));
            } else {
                header('Location: ' . $dash . '?msg=policy_block&tab=replies&reason=' . rawurlencode($reason));
            }
            exit;
        }
        if (PostModeration::mustDelete($policyBundle)) {
            $redirect = $_POST['redirect'] ?? '';
            if ($redirect === 'view') {
                header('Location: ../Views/experience/view.html?msg=reply_moderated');
            } else {
                header('Location: ' . $dash . '?msg=reply_moderated&tab=replies');
            }
            exit;
        }
        try {
            $c->createReponse([
                'post_id' => (int)($_POST['post_id'] ?? 0),
                'nom'     => $_POST['author'] ?? '',
                'email'   => $_POST['email'] ?? '',
                'contenu' => $_POST['content'] ?? '',
            ]);
            $redirect = $_POST['redirect'] ?? '';
            if ($redirect === 'view') {
                header('Location: ../Views/experience/view.html?msg=reply_created');
            } else {
                header('Location: ' . $dash . '?msg=reply_created&tab=replies');
            }
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=reply_error&tab=replies&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    /* ── REPLY UPDATE ── */
    if ($fa === 'reply_update') {
        $id = (int)($_POST['reply_id'] ?? 0);
        $policyBundle = ($_POST['author'] ?? '') . "\n" . ($_POST['email'] ?? '') . "\n" . ($_POST['content'] ?? '');
        $policy = ContentPolicy::scan($policyBundle);
        if ($policy['blocked']) {
            header('Location: ' . $dash . '?msg=policy_block&tab=replies&reason=' . rawurlencode(ContentPolicy::firstBlockReason($policy)));
            exit;
        }
        if (PostModeration::mustDelete($policyBundle)) {
            header('Location: ' . $dash . '?msg=reply_moderated&tab=replies');
            exit;
        }
        try {
            $c->updateReponse($id, [
                'post_id' => (int)($_POST['post_id'] ?? 0),
                'nom'     => $_POST['author'] ?? '',
                'email'   => $_POST['email'] ?? '',
                'contenu' => $_POST['content'] ?? '',
            ]);
            header('Location: ' . $dash . '?msg=reply_updated&tab=replies');
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=reply_error&tab=replies&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    /* ── REPORT POST (public view — moderation queue + auto scan) ── */
    if ($fa === 'report_post') {
        $postId = (int)($_POST['post_id'] ?? 0);
        $reason = trim((string)($_POST['report_reason'] ?? ''));
        $note   = trim((string)($_POST['report_note'] ?? ''));
        $red    = '../Views/experience/view.html';

        if ($postId < 1 || $reason === '') {
            header('Location: ' . $red . '?msg=report_err');
            exit;
        }

        $post = $c->getPost($postId);
        if (!$post) {
            header('Location: ' . $red . '?msg=report_err');
            exit;
        }

        $m       = Post::unpackContenu($post['contenu']);
        $bundle  = ($post['titre'] ?? '') . "\n" . ($m['content'] ?? '') . "\n" . ($m['author'] ?? '') . "\n" . $note;
        $analysis = PostReportAnalyzer::analyze($bundle);

        $pdo = getConnection();
        $pdo->exec("CREATE TABLE IF NOT EXISTS post_report (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            reason VARCHAR(64) NOT NULL,
            reporter_note TEXT,
            scan_level VARCHAR(16) NOT NULL,
            scan_summary VARCHAR(512),
            scan_detail TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            KEY idx_post (post_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $detailJson = json_encode($analysis, JSON_UNESCAPED_UNICODE);
        if (strlen($detailJson) > 8000) {
            $detailJson = substr($detailJson, 0, 8000);
        }

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO post_report (post_id, reason, reporter_note, scan_level, scan_summary, scan_detail)
                 VALUES (?,?,?,?,?,?)'
            );
            $stmt->execute([
                $postId,
                substr($reason, 0, 64),
                substr($note, 0, 2000),
                $analysis['level'],
                substr($analysis['summary'], 0, 512),
                $detailJson,
            ]);
        } catch (PDOException $e) {
            header('Location: ' . $red . '?msg=report_err');
            exit;
        }

        header('Location: ' . $red . '?msg=report_ok&level=' . rawurlencode($analysis['level']) . '&sum=' . rawurlencode(substr($analysis['summary'], 0, 120)));
        exit;
    }

    /* ── REPLY DELETE ── */
    if ($fa === 'reply_delete') {
        $id = (int)($_POST['reply_id'] ?? 0);
        $c->deleteReponse($id);
        header('Location: ' . $dash . '?msg=reply_deleted&tab=replies');
        exit;
    }
}
