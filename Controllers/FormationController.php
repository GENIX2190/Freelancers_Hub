<?php
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Formation.php';
require_once dirname(__DIR__) . '/Models/Avis.php';

class FormationController {

    private $pdo;

    public function __construct() {
        $this->pdo = getConnection();
    }

    public function index()            { return $this->listFormation(); }
    public function show($id)          { return $this->getFormation($id); }
    public function create($data)      { return $this->createFormation($data); }
    public function update($id, $data) { return $this->updateFormation($id, $data); }
    public function delete($id)        { return $this->deleteFormation($id); }

    public function listFormation() {
        $stmt = $this->pdo->query("SELECT * FROM formation ORDER BY date_creation DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getFormation($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM formation WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createFormation($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO formation (titre, description, duree, prix, niveau, categorie, image, date_creation)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        $stmt->execute([
            $data['titre'],
            $data['description'] ?? null,
            $data['duree']       ?? null,
            $data['prix']        ?? null,
            $data['niveau']      ?? null,
            $data['categorie']   ?? null,
            $data['image']       ?? null,
        ]);
        return $this->pdo->lastInsertId();
    }

    public function updateFormation($id, $data) {
        $stmt = $this->pdo->prepare(
            "UPDATE formation SET titre=?, description=?, duree=?, prix=?, niveau=?, categorie=?, image=? WHERE id=?"
        );
        return $stmt->execute([
            $data['titre'],
            $data['description'] ?? null,
            $data['duree']       ?? null,
            $data['prix']        ?? null,
            $data['niveau']      ?? null,
            $data['categorie']   ?? null,
            $data['image']       ?? null,
            $id
        ]);
    }

    public function deleteFormation($id) {
        $stmt = $this->pdo->prepare("DELETE FROM formation WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function listAvis() {
        $stmt = $this->pdo->query("SELECT * FROM evaluation_formation ORDER BY date_avis DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAvis($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM evaluation_formation WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createAvis($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO evaluation_formation (formation_id, user_id, note, commentaire, date_avis)
             VALUES (?, ?, ?, ?, NOW())"
        );
        $stmt->execute([
            $data['formation_id'],
            $data['user_id'],
            $data['note'],
            $data['commentaire'] ?? null,
        ]);
        return $this->pdo->lastInsertId();
    }

    public function updateAvis($id, $data) {
        $stmt = $this->pdo->prepare(
            "UPDATE evaluation_formation SET formation_id=?, user_id=?, note=?, commentaire=? WHERE id=?"
        );
        return $stmt->execute([
            $data['formation_id'],
            $data['user_id'],
            $data['note'],
            $data['commentaire'] ?? null,
            $id,
        ]);
    }

    public function deleteAvis($id) {
        $stmt = $this->pdo->prepare("DELETE FROM evaluation_formation WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function listAvisWithFormation() {
        $stmt = $this->pdo->query(
            "SELECT a.*, f.titre AS formation_titre, u.email AS user_email
             FROM evaluation_formation a
             LEFT JOIN formation f ON f.id = a.formation_id
             LEFT JOIN utilisateur u ON u.id = a.user_id
             ORDER BY a.date_avis DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

/* ═══════════════════════════════════════════
   HTTP HANDLERS
   ═══════════════════════════════════════════ */
$dash = '../Views/formations/dashboard.html';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'list_formations') {
        $c    = new FormationController();
        $rows = $c->listFormation();
        $out  = [];
        foreach ($rows as $r) {
            $m = Formation::unpackDesc($r['description']);
            $out[] = [
                'id'            => (int)$r['id'],
                'title'         => $r['titre'],
                'category'      => $r['categorie'] ?? '',
                'instructor'    => $m['instructor'],
                'totalHours'    => (int)($r['duree'] ?? 0),
                'hoursDone'     => (int)$m['hoursDone'],
                'status'        => $m['status'],
                'rating'        => $m['rating'],
                'startDate'     => $m['startDate'],
                'description'   => $m['description'],
                'prix'          => $r['prix'],
                'niveau'        => $r['niveau'] ?? '',
                'image'         => $r['image'] ?? '',
                'date_creation' => $r['date_creation'],
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($out);
        exit;
    }

    if ($action === 'list_avis') {
        $c    = new FormationController();
        $rows = $c->listAvisWithFormation();
        $out  = [];
        foreach ($rows as $r) {
            $cm = Avis::unpackComment($r['commentaire']);
            $out[] = [
                'id'          => (int)$r['id'],
                'courseId'    => (int)$r['formation_id'],
                'courseTitle' => $r['formation_titre'] ?? '—',
                'student'     => $r['user_email'] ?? $cm['student'],
                'rating'      => (int)$r['note'],
                'comment'     => $cm['comment'],
                'date'        => substr($r['date_avis'], 0, 10),
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($out);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fa = $_POST['form_action'] ?? '';
    $c  = new FormationController();

    if ($fa === 'course_create') {
        $packed = Formation::packDesc(
            $_POST['instructor']  ?? '',
            $_POST['hours_done']  ?? 0,
            $_POST['status']      ?? 'Planned',
            $_POST['rating']      ?? null,
            $_POST['start_date']  ?? '',
            $_POST['description'] ?? ''
        );
        try {
            $c->createFormation([
                'titre'       => $_POST['title']       ?? '',
                'description' => $packed,
                'duree'       => $_POST['total_hours'] ?? null,
                'prix'        => $_POST['prix']        ?? null,
                'niveau'      => $_POST['niveau']      ?? null,
                'categorie'   => $_POST['category']    ?? null,
                'image'       => $_POST['image']       ?? null,
            ]);
            $redirect = $_POST['redirect'] ?? '';
            if ($redirect === 'create') {
                header('Location: ../Views/formations/create.html?msg=course_created');
            } else {
                header('Location: ' . $dash . '?msg=course_created');
            }
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=course_error&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    if ($fa === 'course_update') {
        $id = (int)($_POST['course_id'] ?? 0);
        $packed = Formation::packDesc(
            $_POST['instructor']  ?? '',
            $_POST['hours_done']  ?? 0,
            $_POST['status']      ?? 'Planned',
            $_POST['rating']      ?? null,
            $_POST['start_date']  ?? '',
            $_POST['description'] ?? ''
        );
        try {
            $c->updateFormation($id, [
                'titre'       => $_POST['title']       ?? '',
                'description' => $packed,
                'duree'       => $_POST['total_hours'] ?? null,
                'prix'        => $_POST['prix']        ?? null,
                'niveau'      => $_POST['niveau']      ?? null,
                'categorie'   => $_POST['category']    ?? null,
                'image'       => $_POST['image']       ?? null,
            ]);
            header('Location: ' . $dash . '?msg=course_updated');
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=course_error&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    if ($fa === 'course_delete') {
        $id = (int)($_POST['course_id'] ?? 0);
        $c->deleteFormation($id);
        header('Location: ' . $dash . '?msg=course_deleted');
        exit;
    }

    if ($fa === 'avis_create') {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $uid = $_SESSION['user_id'] ?? null;
        if (!$uid) {
            $pdo = getConnection();
            $row = $pdo->query("SELECT id FROM utilisateur ORDER BY id LIMIT 1")->fetch();
            $uid = $row ? $row['id'] : 1;
        }
        $packed = Avis::packComment($_SESSION['email'] ?? '', $_POST['comment'] ?? '');
        try {
            $c->createAvis([
                'formation_id' => (int)($_POST['formation_id'] ?? 0),
                'user_id'      => (int)$uid,
                'note'         => (int)($_POST['rating']       ?? 0),
                'commentaire'  => $packed,
            ]);
            header('Location: ../Views/formations/learn.html?msg=avis_created');
        } catch (PDOException $e) {
            header('Location: ../Views/formations/learn.html?msg=avis_error&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    if ($fa === 'avis_update') {
        $id = (int)($_POST['avis_id'] ?? 0);
        if (session_status() === PHP_SESSION_NONE) session_start();
        $uid = $_SESSION['user_id'] ?? null;
        if (!$uid) {
            $pdo = getConnection();
            $row = $pdo->query("SELECT id FROM utilisateur ORDER BY id LIMIT 1")->fetch();
            $uid = $row ? $row['id'] : 1;
        }
        $packed = Avis::packComment($_SESSION['email'] ?? '', $_POST['comment'] ?? '');
        try {
            $c->updateAvis($id, [
                'formation_id' => (int)($_POST['formation_id'] ?? 0),
                'user_id'      => (int)$uid,
                'note'         => (int)($_POST['rating']       ?? 0),
                'commentaire'  => $packed,
            ]);
            header('Location: ' . $dash . '?msg=avis_updated&tab=evaluations');
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=avis_error&tab=evaluations&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    if ($fa === 'avis_delete') {
        $id = (int)($_POST['avis_id'] ?? 0);
        $c->deleteAvis($id);
        header('Location: ' . $dash . '?msg=avis_deleted&tab=evaluations');
        exit;
    }
}