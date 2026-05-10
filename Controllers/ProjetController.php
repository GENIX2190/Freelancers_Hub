<?php
/**
 * Module Projets (projet, tache) — one controller file.
 */
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Projets.php';

class ProjetController {

    private $pdo;

    public function __construct() {
        $this->pdo = getConnection();
    }

    public function index() {
        return $this->listProjet();
    }

    /** Projet resource: aliases for generic CRUD naming */
    public function show($id) {
        return $this->getProjet($id);
    }

    public function create($data) {
        return $this->createProjet($data);
    }

    public function update($id, $data) {
        return $this->updateProjet($id, $data);
    }

    public function delete($id) {
        return $this->deleteProjet($id);
    }

    public function listProjet() {
        $stmt = $this->pdo->query("SELECT * FROM projet ORDER BY date_creation DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getProjet($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM projet WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createProjet($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO projet (titre, description, date_creation, statut, user_id)
             VALUES (?, ?, NOW(), ?, ?)"
        );
        $stmt->execute([
            $data['titre'],
            $data['description'] ?? null,
            $data['statut'] ?? 'en_cours',
            $data['user_id'],
        ]);
        return $this->pdo->lastInsertId();
    }

    public function updateProjet($id, $data) {
        $stmt = $this->pdo->prepare(
            "UPDATE projet SET titre=?, description=?, statut=?, user_id=? WHERE id=?"
        );
        return $stmt->execute([
            $data['titre'],
            $data['description'] ?? null,
            $data['statut'] ?? 'en_cours',
            $data['user_id'],
            $id,
        ]);
    }

    public function deleteProjet($id) {
        $stmt = $this->pdo->prepare("DELETE FROM projet WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function listTache() {
        $stmt = $this->pdo->query("SELECT * FROM tache ORDER BY id DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTache($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM tache WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createTache($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO tache (projet_id, titre, description, statut, priorite, date_echeance)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['projet_id'],
            $data['titre'],
            $data['description'] ?? null,
            $data['statut'] ?? 'a_faire',
            $data['priorite'] ?? 'normale',
            $data['date_echeance'] ?? null,
        ]);
        return $this->pdo->lastInsertId();
    }

    public function updateTache($id, $data) {
        $stmt = $this->pdo->prepare(
            "UPDATE tache SET projet_id=?, titre=?, description=?, statut=?, priorite=?, date_echeance=? WHERE id=?"
        );
        return $stmt->execute([
            $data['projet_id'],
            $data['titre'],
            $data['description'] ?? null,
            $data['statut'] ?? 'a_faire',
            $data['priorite'] ?? 'normale',
            $data['date_echeance'] ?? null,
            $id,
        ]);
    }

    public function deleteTache($id) {
        $stmt = $this->pdo->prepare("DELETE FROM tache WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function listTacheWithProjet() {
        $stmt = $this->pdo->query(
            "SELECT t.*, p.titre AS projet_titre
             FROM tache t
             LEFT JOIN projet p ON p.id = t.projet_id
             ORDER BY t.id DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Tasks with expiration metadata for the Task Expiration Center (due dates, buckets, day counts).
     */
    public function listTacheWithExpirationMeta() {
        $rows = $this->listTacheWithProjet();
        $today = strtotime('today');
        $summary = [
            'overdue'   => 0,
            'due_soon'  => 0,
            'upcoming'  => 0,
            'no_due'    => 0,
            'closed'    => 0,
        ];
        $out = [];

        foreach ($rows as $r) {
            $stat = $r['statut'] ?? '';
            $closed = in_array($stat, ['Completed', 'Cancelled'], true);
            $dueRaw = $r['date_echeance'] ?? null;
            $dueTs = $dueRaw ? strtotime($dueRaw) : null;
            $daysUntil = null;
            $bucket = 'no_due';

            if ($closed) {
                $bucket = 'closed';
            } elseif (!$dueRaw) {
                $bucket = 'no_due';
            } else {
                $daysUntil = (int) round(($dueTs - $today) / 86400);
                if ($daysUntil < 0) {
                    $bucket = 'overdue';
                } elseif ($daysUntil <= 7) {
                    $bucket = 'due_soon';
                } else {
                    $bucket = 'upcoming';
                }
            }

            $summary[$bucket]++;

            $td = Tache::unpackDesc($r['description']);
            $out[] = [
                'id'               => (int)$r['id'],
                'name'             => $r['titre'],
                'projectId'        => (int)$r['projet_id'],
                'projectTitle'     => $r['projet_titre'] ?? '—',
                'assigned'         => $td['assigned'],
                'priority'         => $r['priorite'],
                'status'           => $stat,
                'due'              => $dueRaw ?? '',
                'notes'            => $td['notes'],
                'expirationBucket' => $bucket,
                'daysUntilDue'     => $daysUntil,
            ];
        }

        usort($out, function ($a, $b) {
            $order = ['overdue' => 0, 'due_soon' => 1, 'upcoming' => 2, 'no_due' => 3, 'closed' => 4];
            $cmp = ($order[$a['expirationBucket']] ?? 99) <=> ($order[$b['expirationBucket']] ?? 99);
            if ($cmp !== 0) {
                return $cmp;
            }
            $da = $a['due'] ? strtotime($a['due']) : PHP_INT_MAX;
            $db = $b['due'] ? strtotime($b['due']) : PHP_INT_MAX;
            return $da <=> $db;
        });

        return ['summary' => $summary, 'tasks' => $out];
    }
}

/* ═══════════════════════════════════════════
   HTTP HANDLERS — GET JSON + POST CRUD
   ═══════════════════════════════════════════ */
$dash = '../Views/projets/dashboard.html';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    if (in_array($action, ['list_projects', 'list_tasks', 'list_tasks_expiration'], true)) {
        session_ensure_started();
        session_enforce_idle_timeout(true);
    }

    if ($action === 'list_projects') {
        $c    = new ProjetController();
        $rows = $c->listProjet();
        $out  = [];
        foreach ($rows as $r) {
            $m = Projet::unpackDesc($r['description']);
            $out[] = [
                'id'          => (int)$r['id'],
                'title'       => $r['titre'],
                'category'    => $m['category'],
                'client'      => $m['client'],
                'status'      => Projet::dbStatusToUi($r['statut']),
                'progress'    => (int)$m['progress'],
                'priority'    => $m['priority'],
                'start'       => $m['start'],
                'end'         => $m['end'],
                'desc'        => $m['description'],
                'date_creation' => $r['date_creation'],
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($out);
        exit;
    }

    if ($action === 'list_tasks') {
        $c    = new ProjetController();
        $rows = $c->listTacheWithProjet();
        $out  = [];
        foreach ($rows as $r) {
            $td = Tache::unpackDesc($r['description']);
            $out[] = [
                'id'        => (int)$r['id'],
                'name'      => $r['titre'],
                'projectId' => (int)$r['projet_id'],
                'projectTitle' => $r['projet_titre'] ?? '—',
                'assigned'  => $td['assigned'],
                'priority'  => $r['priorite'],
                'status'    => $r['statut'],
                'due'       => $r['date_echeance'] ?? '',
                'notes'     => $td['notes'],
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($out);
        exit;
    }

    if ($action === 'list_tasks_expiration') {
        $c   = new ProjetController();
        $payload = $c->listTacheWithExpirationMeta();
        header('Content-Type: application/json');
        echo json_encode($payload);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fa = $_POST['form_action'] ?? '';
    $c  = new ProjetController();

    session_ensure_started();
    session_enforce_idle_timeout(false);
    $uid = $_SESSION['user_id'] ?? null;
    if (!$uid) {
        $pdo = getConnection();
        $row = $pdo->query("SELECT id FROM utilisateur ORDER BY id LIMIT 1")->fetch();
        $uid = $row ? $row['id'] : 1;
    }

    /* ── PROJECT CREATE ── */
    if ($fa === 'project_create') {
        $packed = Projet::packDesc(
            $_POST['category'] ?? '', $_POST['client'] ?? '',
            $_POST['progress'] ?? 0, $_POST['priority'] ?? 'Normal',
            $_POST['start'] ?? '', $_POST['end'] ?? '',
            $_POST['description'] ?? ''
        );
        try {
            $c->createProjet([
                'titre'       => $_POST['title'] ?? '',
                'description' => $packed,
                'statut'      => Projet::uiStatusToDb($_POST['status'] ?? 'Planning'),
                'user_id'     => (int)$uid,
            ]);
            header('Location: ' . $dash . '?msg=project_created');
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=project_error&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    /* ── PROJECT UPDATE ── */
    if ($fa === 'project_update') {
        $id = (int)($_POST['project_id'] ?? 0);
        $packed = Projet::packDesc(
            $_POST['category'] ?? '', $_POST['client'] ?? '',
            $_POST['progress'] ?? 0, $_POST['priority'] ?? 'Normal',
            $_POST['start'] ?? '', $_POST['end'] ?? '',
            $_POST['description'] ?? ''
        );
        try {
            $c->updateProjet($id, [
                'titre'       => $_POST['title'] ?? '',
                'description' => $packed,
                'statut'      => Projet::uiStatusToDb($_POST['status'] ?? 'Planning'),
                'user_id'     => (int)$uid,
            ]);
            header('Location: ' . $dash . '?msg=project_updated');
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=project_error&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    /* ── PROJECT DELETE ── */
    if ($fa === 'project_delete') {
        $id = (int)($_POST['project_id'] ?? 0);
        $c->deleteProjet($id);
        header('Location: ' . $dash . '?msg=project_deleted');
        exit;
    }

    /* ── TASK CREATE ── */
    if ($fa === 'task_create') {
        $packed = Tache::packDesc($_POST['assigned'] ?? '', $_POST['notes'] ?? '');
        try {
            $c->createTache([
                'projet_id'    => (int)($_POST['project_id'] ?? 0),
                'titre'        => $_POST['name'] ?? '',
                'description'  => $packed,
                'statut'       => $_POST['status'] ?? 'Pending',
                'priorite'     => $_POST['priority'] ?? 'Medium',
                'date_echeance'=> $_POST['due'] ?? null,
            ]);
            header('Location: ' . $dash . '?msg=task_created&tab=tasks');
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=task_error&tab=tasks&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    /* ── TASK UPDATE ── */
    if ($fa === 'task_update') {
        $id = (int)($_POST['task_id'] ?? 0);
        $packed = Tache::packDesc($_POST['assigned'] ?? '', $_POST['notes'] ?? '');
        try {
            $c->updateTache($id, [
                'projet_id'    => (int)($_POST['project_id'] ?? 0),
                'titre'        => $_POST['name'] ?? '',
                'description'  => $packed,
                'statut'       => $_POST['status'] ?? 'Pending',
                'priorite'     => $_POST['priority'] ?? 'Medium',
                'date_echeance'=> $_POST['due'] ?? null,
            ]);
            header('Location: ' . $dash . '?msg=task_updated&tab=tasks');
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=task_error&tab=tasks&err=' . urlencode($e->getMessage()));
        }
        exit;
    }

    /* ── TASK DELETE ── */
    if ($fa === 'task_delete') {
        $id = (int)($_POST['task_id'] ?? 0);
        $c->deleteTache($id);
        header('Location: ' . $dash . '?msg=task_deleted&tab=tasks');
        exit;
    }
}
