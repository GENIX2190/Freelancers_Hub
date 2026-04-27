<?php
/**
 * Module Experience / blog (post, reponse) — one controller file.
 */
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Experience.php';

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
        $stmt = $this->pdo->prepare("DELETE FROM post WHERE id = ?");
        return $stmt->execute([$id]);
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
             LEFT JOIN post p ON p.id = r.post_id
             ORDER BY r.date_reponse DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

/* ═══════════════════════════════════════════
   HTTP HANDLERS — GET JSON + POST CRUD
   ═══════════════════════════════════════════ */
$dash = '../Views/experience/dashboard.html';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'list_posts') {
        $c    = new ExperienceController();
        $rows = $c->listPost();
        $out  = [];
        foreach ($rows as $r) {
            $m = Post::unpackContenu($r['contenu']);
            $out[] = [
                'id'       => (int)$r['id'],
                'title'    => $r['titre'],
                'category' => $r['categorie'] ?? '',
                'author'   => $m['author'],
                'status'   => Post::dbStatusToUi($r['statut']),
                'date'     => substr($r['date_publication'], 0, 10),
                'tags'     => $r['tags'] ?? '',
                'content'  => $m['content'],
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($out);
        exit;
    }

    if ($action === 'list_replies') {
        $c    = new ExperienceController();
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

    /* ── REPLY CREATE ── */
    if ($fa === 'reply_create') {
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

    /* ── REPLY DELETE ── */
    if ($fa === 'reply_delete') {
        $id = (int)($_POST['reply_id'] ?? 0);
        $c->deleteReponse($id);
        header('Location: ' . $dash . '?msg=reply_deleted&tab=replies');
        exit;
    }
}
