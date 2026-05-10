<?php
/**
 * Module Missions (categorie, mission, candidature) — one controller file.
 */
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Missions.php';

class MissionController {

    private $pdo;

    public function __construct() {
        $this->pdo = getConnection();
    }

    public function index() {
        return $this->listMission();
    }

    /** Mission resource: aliases for generic CRUD naming */
    public function show($id) {
        return $this->getMission($id);
    }

    public function create($data) {
        return $this->createMission($data);
    }

    public function update($id, $data) {
        return $this->updateMission($id, $data);
    }

    public function delete($id) {
        return $this->deleteMission($id);
    }

    /* ─── categorie ─── */
    public function listCategorie() {
        $stmt = $this->pdo->query("SELECT * FROM categorie ORDER BY id DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getCategorie($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM categorie WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createCategorie($data) {
        $stmt = $this->pdo->prepare("INSERT INTO categorie (nom, description) VALUES (?, ?)");
        $stmt->execute([$data['nom'], $data['description'] ?? null]);
        return $this->pdo->lastInsertId();
    }

    public function updateCategorie($id, $data) {
        $stmt = $this->pdo->prepare("UPDATE categorie SET nom=?, description=? WHERE id=?");
        return $stmt->execute([$data['nom'], $data['description'] ?? null, $id]);
    }

    public function deleteCategorie($id) {
        $stmt = $this->pdo->prepare("DELETE FROM categorie WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /* ─── mission ─── */
    public function listMission() {
        $stmt = $this->pdo->query("SELECT * FROM mission ORDER BY date_creation DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMission($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM mission WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createMission($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO mission (titre, description, budget, deadline, statut, date_creation, categorie_id, contact_email)
             VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)"
        );
        $stmt->execute([
            $data['titre'],
            $data['description'] ?? null,
            $data['budget'] ?? null,
            $data['deadline'] ?? null,
            $data['statut'] ?? 'ouverte',
            $data['categorie_id'],
            isset($data['contact_email']) && filter_var((string) $data['contact_email'], FILTER_VALIDATE_EMAIL)
                ? (string) $data['contact_email'] : null,
        ]);
        return $this->pdo->lastInsertId();
    }

    public function updateMission($id, $data) {
        $stmt = $this->pdo->prepare(
            "UPDATE mission SET titre=?, description=?, budget=?, deadline=?, statut=?, categorie_id=?, contact_email=? WHERE id=?"
        );
        return $stmt->execute([
            $data['titre'],
            $data['description'] ?? null,
            $data['budget'] ?? null,
            $data['deadline'] ?? null,
            $data['statut'] ?? 'ouverte',
            $data['categorie_id'],
            isset($data['contact_email']) && filter_var((string) $data['contact_email'], FILTER_VALIDATE_EMAIL)
                ? (string) $data['contact_email'] : null,
            $id,
        ]);
    }

    public function deleteMission($id) {
        $stmt = $this->pdo->prepare("DELETE FROM mission WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /* ─── candidature ─── */
    public function listCandidature() {
        $stmt = $this->pdo->query("SELECT * FROM candidature ORDER BY date_candidature DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getCandidature($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM candidature WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createCandidature($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO candidature (mission_id, user_id, date_candidature, statut, message)
             VALUES (?, ?, NOW(), ?, ?)"
        );
        $stmt->execute([
            $data['mission_id'],
            $data['user_id'],
            $data['statut'] ?? 'en_attente',
            $data['message'] ?? null,
        ]);
        return $this->pdo->lastInsertId();
    }

    public function updateCandidature($id, $data) {
        $stmt = $this->pdo->prepare(
            "UPDATE candidature SET mission_id=?, user_id=?, statut=?, message=? WHERE id=?"
        );
        return $stmt->execute([
            $data['mission_id'],
            $data['user_id'],
            $data['statut'] ?? 'en_attente',
            $data['message'] ?? null,
            $id,
        ]);
    }

    public function deleteCandidature($id) {
        $stmt = $this->pdo->prepare("DELETE FROM candidature WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function listMissionWithCategory() {
        $stmt = $this->pdo->query(
            "SELECT m.*, c.nom AS cat_nom, c.description AS cat_desc
             FROM mission m LEFT JOIN categorie c ON m.categorie_id = c.id
             ORDER BY m.date_creation DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listCandidatureWithMission() {
        $stmt = $this->pdo->query(
            "SELECT ca.*, m.titre AS mission_titre
             FROM candidature ca LEFT JOIN mission m ON ca.mission_id = m.id
             ORDER BY ca.date_candidature DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

/* ─── HTTP handlers ─── */
if (isset($_SERVER['SCRIPT_FILENAME']) && basename(__FILE__) === basename((string) $_SERVER['SCRIPT_FILENAME'])) {
    require_once dirname(__DIR__) . '/Models/Utilisateur.php';
    $dash = '../Views/missions/dashboard.html';
    $ctrl = new MissionController();

    /* ── GET: JSON lists ── */
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $act = $_GET['action'] ?? '';

        if ($act === 'list_missions') {
            $rows = $ctrl->listMissionWithCategory();
            $out = [];
            foreach ($rows as $r) {
                $extra = Mission::unpackDesc($r['description']);
                $out[] = [
                    'id' => (int)$r['id'], 'title' => $r['titre'],
                    'category' => $r['cat_nom'] ?? '', 'categorie_id' => (int)$r['categorie_id'],
                    'client' => $extra['client'],
                    'contact_email' => isset($r['contact_email']) ? trim((string) $r['contact_email']) : '',
                    'budget' => (float)$r['budget'],
                    'status' => $r['statut'], 'deadline' => $r['deadline'] ?? '',
                    'progress' => $extra['progress'], 'priority' => $extra['priority'],
                    'description' => $extra['description'], 'date_creation' => $r['date_creation'],
                ];
            }
            header('Content-Type: application/json');
            echo json_encode($out);
            exit;
        }

        if ($act === 'list_categories') {
            $rows = $ctrl->listCategorie();
            $out = [];
            foreach ($rows as $r) {
                $cd = Categorie::unpackDesc($r['description']);
                $out[] = ['id' => (int)$r['id'], 'name' => $r['nom'], 'icon' => $cd['icon'], 'desc' => $cd['description']];
            }
            header('Content-Type: application/json');
            echo json_encode($out);
            exit;
        }

        if ($act === 'list_candidatures') {
            $rows = $ctrl->listCandidatureWithMission();
            $out = [];
            foreach ($rows as $r) {
                $cm = Candidature::unpackMsg($r['message']);
                $out[] = [
                    'id' => (int)$r['id'], 'missionId' => (int)$r['mission_id'],
                    'missionTitle' => $r['mission_titre'] ?? '', 'userId' => (int)$r['user_id'],
                    'name' => $cm['name'], 'email' => $cm['email'], 'phone' => $cm['phone'],
                    'experience' => $cm['experience'], 'rate' => $cm['rate'],
                    'status' => $r['statut'], 'date' => substr($r['date_candidature'], 0, 10),
                    'message' => $cm['message'],
                ];
            }
            header('Content-Type: application/json');
            echo json_encode($out);
            exit;
        }
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { exit; }

    $fa = trim((string)($_POST['form_action'] ?? ''));

    /* ── Mission CRUD ── */
    if ($fa === 'mission_create') {
        $embed = (($_POST['redirect'] ?? '') === 'mission_embed');
        $embedUrl = '../Views/missions/mission-embed.html';
        $desc = Mission::packDesc($_POST['client'] ?? '', $_POST['progress'] ?? 0, $_POST['priority'] ?? 'Normal', $_POST['description'] ?? '');
        try {
            $ctrl->createMission([
                'titre' => $_POST['title'] ?? '',
                'description' => $desc,
                'budget' => $_POST['budget'] ?? null,
                'deadline' => $_POST['deadline'] ?? null,
                'statut' => $_POST['status'] ?? 'Active',
                'categorie_id' => $_POST['categorie_id'] ?? 0,
                'contact_email' => trim((string) ($_POST['contact_email'] ?? '')),
            ]);
            header('Location: ' . ($embed ? $embedUrl . '?msg=created' : $dash . '?msg=created'), true, 302);
        } catch (PDOException $e) {
            header('Location: ' . ($embed ? $embedUrl . '?msg=error' : $dash . '?msg=error'), true, 302);
        }
        exit;
    }
    if ($fa === 'mission_update') {
        $id = (int)($_POST['item_id'] ?? 0);
        if ($id <= 0) { header('Location: ' . $dash . '?msg=invalid', true, 302); exit; }
        $desc = Mission::packDesc($_POST['client'] ?? '', $_POST['progress'] ?? 0, $_POST['priority'] ?? 'Normal', $_POST['description'] ?? '');
        try {
            $ctrl->updateMission($id, [
                'titre' => $_POST['title'] ?? '',
                'description' => $desc,
                'budget' => $_POST['budget'] ?? null,
                'deadline' => $_POST['deadline'] ?? null,
                'statut' => $_POST['status'] ?? 'Active',
                'categorie_id' => $_POST['categorie_id'] ?? 0,
                'contact_email' => trim((string) ($_POST['contact_email'] ?? '')),
            ]);
            header('Location: ' . $dash . '?msg=updated', true, 302);
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=error', true, 302);
        }
        exit;
    }
    if ($fa === 'mission_delete') {
        $id = (int)($_POST['item_id'] ?? 0);
        if ($id > 0) { try { $ctrl->deleteMission($id); } catch (PDOException $e) {} }
        header('Location: ' . $dash . '?msg=deleted', true, 302); exit;
    }

    /* ── Category CRUD ── */
    if ($fa === 'cat_create') {
        $desc = Categorie::packDesc($_POST['icon'] ?? '', $_POST['cat_description'] ?? '');
        $ctrl->createCategorie(['nom' => $_POST['name'] ?? '', 'description' => $desc]);
        header('Location: ' . $dash . '?msg=cat_created&tab=categories', true, 302); exit;
    }
    if ($fa === 'cat_update') {
        $id = (int)($_POST['item_id'] ?? 0);
        if ($id <= 0) { header('Location: ' . $dash . '?msg=invalid', true, 302); exit; }
        $desc = Categorie::packDesc($_POST['icon'] ?? '', $_POST['cat_description'] ?? '');
        $ctrl->updateCategorie($id, ['nom' => $_POST['name'] ?? '', 'description' => $desc]);
        header('Location: ' . $dash . '?msg=cat_updated&tab=categories', true, 302); exit;
    }
    if ($fa === 'cat_delete') {
        $id = (int)($_POST['item_id'] ?? 0);
        if ($id > 0) { try { $ctrl->deleteCategorie($id); } catch (PDOException $e) {} }
        header('Location: ' . $dash . '?msg=cat_deleted&tab=categories', true, 302); exit;
    }

    /* ── Candidature CRUD ── */
    $getValidUserId = static function () use ($ctrl) {
        $uid = (int)($_POST['user_id'] ?? 0);
        if ($uid > 0) return $uid;
        if (session_status() === PHP_SESSION_NONE) session_start();
        $sid = (int)($_SESSION['user_id'] ?? 0);
        if ($sid > 0) return $sid;
        $pdo = getConnection();
        $row = $pdo->query("SELECT id FROM utilisateur ORDER BY id ASC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['id'] : 1;
    };

    if ($fa === 'cand_create') {
        $isPublic = (($_POST['redirect'] ?? '') === 'candidature');
        $redir = $isPublic ? '../Views/missions/candidature.html' : $dash . '&tab=candidatures';
        $msg = Candidature::packMsg($_POST['name'] ?? '', $_POST['email'] ?? '', $_POST['phone'] ?? '', $_POST['experience'] ?? '', $_POST['rate'] ?? null, $_POST['cand_message'] ?? '');
        try {
            $ctrl->createCandidature([
                'mission_id' => $_POST['mission_id'] ?? 0,
                'user_id' => $getValidUserId(),
                'statut' => $_POST['status'] ?? 'Pending',
                'message' => $msg,
            ]);

            $mailOpts = null;
            if ($isPublic && defined('APPLICATION_MAIL_ENABLED') && APPLICATION_MAIL_ENABLED) {
                $mid = (int) ($_POST['mission_id'] ?? 0);
                $missionRow = $mid > 0 ? $ctrl->getMission($mid) : null;
                $mailOpts = [
                    'mission_id'           => $mid,
                    'mission_title'        => $missionRow['titre'] ?? '',
                    'mission_contact_email'=> isset($missionRow['contact_email'])
                        ? trim((string) $missionRow['contact_email']) : '',
                    'applicant_name'       => trim((string) ($_POST['name'] ?? '')),
                    'applicant_email'      => trim((string) ($_POST['email'] ?? '')),
                    'statut'               => $_POST['status'] ?? 'Pending',
                    'body_text'            => (string) ($_POST['cand_message'] ?? ''),
                ];
            }

            header('Location: ' . $redir . '?msg=cand_created', true, 302);
            while (ob_get_level() > 0) {
                ob_end_flush();
            }
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_write_close();
            }
            ignore_user_abort(true);

            if ($mailOpts !== null) {
                if (function_exists('fastcgi_finish_request')) {
                    fastcgi_finish_request();
                    require_once __DIR__ . '/notification-e/application_mail.php';
                    fh_send_application_emails($mailOpts);
                } elseif (function_exists('litespeed_finish_request')) {
                    litespeed_finish_request();
                    require_once __DIR__ . '/notification-e/application_mail.php';
                    fh_send_application_emails($mailOpts);
                } else {
                    register_shutdown_function(static function () use ($mailOpts): void {
                        require_once __DIR__ . '/notification-e/application_mail.php';
                        fh_send_application_emails($mailOpts);
                    });
                }
            }
        } catch (PDOException $e) {
            header('Location: ' . $redir . '?msg=cand_error&err=' . urlencode($e->getMessage()), true, 302);
        }
        exit;
    }
    if ($fa === 'cand_update') {
        $id = (int)($_POST['item_id'] ?? 0);
        if ($id <= 0) { header('Location: ' . $dash . '?msg=invalid', true, 302); exit; }
        $msg = Candidature::packMsg($_POST['name'] ?? '', $_POST['email'] ?? '', $_POST['phone'] ?? '', $_POST['experience'] ?? '', $_POST['rate'] ?? null, $_POST['cand_message'] ?? '');
        try {
            $ctrl->updateCandidature($id, [
                'mission_id' => $_POST['mission_id'] ?? 0,
                'user_id' => $getValidUserId(),
                'statut' => $_POST['status'] ?? 'Pending',
                'message' => $msg,
            ]);
            header('Location: ' . $dash . '?msg=cand_updated&tab=candidatures', true, 302);
        } catch (PDOException $e) {
            header('Location: ' . $dash . '?msg=cand_error&tab=candidatures', true, 302);
        }
        exit;
    }
    if ($fa === 'cand_delete') {
        $id = (int)($_POST['item_id'] ?? 0);
        if ($id > 0) { $ctrl->deleteCandidature($id); }
        header('Location: ' . $dash . '?msg=cand_deleted&tab=candidatures', true, 302); exit;
    }

    header('Location: ' . $dash, true, 302); exit;
}
