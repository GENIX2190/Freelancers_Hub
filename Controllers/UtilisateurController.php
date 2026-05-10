<?php
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Utilisateur.php';

/**
 * @return bool True when Google accepts the token (reCAPTCHA v2).
 */
function verify_recaptcha_v2(?string $response): bool {
    $secret = defined('RECAPTCHA_SECRET_KEY') ? RECAPTCHA_SECRET_KEY : '';
    if ($secret === '' || $response === null || $response === '') {
        return false;
    }
    $payload = http_build_query([
        'secret' => $secret,
        'response' => $response,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $payload,
            'timeout' => 8,
        ],
    ]);
    $raw = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $ctx);
    if ($raw === false) {
        return false;
    }
    $data = json_decode($raw, true);
    return is_array($data) && !empty($data['success']);
}

class UtilisateurController {

    private $pdo;

    public function __construct() {
        $this->pdo = getConnection();
    }

    public function index() {
        $stmt = $this->pdo->query("SELECT id, cin, email, role, date_inscription, localisation, bio, statut FROM utilisateur ORDER BY id DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function show($id) {
        $stmt = $this->pdo->prepare("SELECT id, cin, email, role, date_inscription, localisation, bio, statut FROM utilisateur WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Used by login: returns row including mot_de_passe hash, or false.
     */
    public function findByEmailForAuth($email) {
        $stmt = $this->pdo->prepare(
            "SELECT id, cin, email, mot_de_passe, role, statut FROM utilisateur WHERE email = ? LIMIT 1"
        );
        $stmt->execute([$email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: false;
    }

    public function create($data) {
        $hash = password_hash($data['mot_de_passe'] ?? '', PASSWORD_DEFAULT);
        $dateIn = $data['date_inscription'] ?? null;
        if (is_string($dateIn) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateIn)) {
            $dateIn .= ' 00:00:00';
        }
        $stmt = $this->pdo->prepare(
            "INSERT INTO utilisateur (cin, email, mot_de_passe, role, date_inscription, localisation, bio, statut)
             VALUES (?, ?, ?, ?, COALESCE(?, NOW()), ?, ?, ?)"
        );
        $stmt->execute([
            $data['cin'],
            $data['email'],
            $hash,
            $data['role'] ?? 'freelance',
            $dateIn,
            $data['localisation'] ?? null,
            $data['bio'] ?? null,
            $data['statut'] ?? 'active',
        ]);
        return $this->pdo->lastInsertId();
    }

    public function update($id, $data) {
        $dateIn = $data['date_inscription'] ?? null;
        if (is_string($dateIn) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateIn)) {
            $dateIn .= ' 00:00:00';
        } else {
            $dateIn = null;
        }

        if (!empty($data['mot_de_passe'])) {
            $hash = password_hash($data['mot_de_passe'], PASSWORD_DEFAULT);
            if ($dateIn !== null) {
                $stmt = $this->pdo->prepare(
                    "UPDATE utilisateur SET cin=?, email=?, mot_de_passe=?, role=?, date_inscription=?, localisation=?, bio=?, statut=? WHERE id=?"
                );
                return $stmt->execute([
                    $data['cin'],
                    $data['email'],
                    $hash,
                    $data['role'] ?? 'freelance',
                    $dateIn,
                    $data['localisation'] ?? null,
                    $data['bio'] ?? null,
                    $data['statut'] ?? 'active',
                    $id,
                ]);
            }
            $stmt = $this->pdo->prepare(
                "UPDATE utilisateur SET cin=?, email=?, mot_de_passe=?, role=?, localisation=?, bio=?, statut=? WHERE id=?"
            );
            return $stmt->execute([
                $data['cin'],
                $data['email'],
                $hash,
                $data['role'] ?? 'freelance',
                $data['localisation'] ?? null,
                $data['bio'] ?? null,
                $data['statut'] ?? 'active',
                $id,
            ]);
        }
        if ($dateIn !== null) {
            $stmt = $this->pdo->prepare(
                "UPDATE utilisateur SET cin=?, email=?, role=?, date_inscription=?, localisation=?, bio=?, statut=? WHERE id=?"
            );
            return $stmt->execute([
                $data['cin'],
                $data['email'],
                $data['role'] ?? 'freelance',
                $dateIn,
                $data['localisation'] ?? null,
                $data['bio'] ?? null,
                $data['statut'] ?? 'active',
                $id,
            ]);
        }
        $stmt = $this->pdo->prepare(
            "UPDATE utilisateur SET cin=?, email=?, role=?, localisation=?, bio=?, statut=? WHERE id=?"
        );
        return $stmt->execute([
            $data['cin'],
            $data['email'],
            $data['role'] ?? 'freelance',
            $data['localisation'] ?? null,
            $data['bio'] ?? null,
            $data['statut'] ?? 'active',
            $id,
        ]);
    }

    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM utilisateur WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * @return array{ok:bool,err?:string}
     */
    public function deleteUserIfAllowed(int $id): array {
        $row = $this->show($id);
        if (!$row) {
            return ['ok' => false, 'err' => 'not_found'];
        }
        if (Utilisateur::isAdminEmail($row['email'])) {
            return ['ok' => false, 'err' => 'protected'];
        }
        return ['ok' => $this->delete($id)];
    }

    /**
     * @return array{ok:bool,err?:string}
     */
    public function toggleBanIfAllowed(int $id): array {
        $row = $this->show($id);
        if (!$row) {
            return ['ok' => false, 'err' => 'not_found'];
        }
        if (Utilisateur::isAdminEmail($row['email'])) {
            return ['ok' => false, 'err' => 'protected'];
        }
        $new = ($row['statut'] === 'banned') ? 'active' : 'banned';
        $ok = $this->update($id, [
            'cin' => $row['cin'],
            'email' => $row['email'],
            'mot_de_passe' => '',
            'role' => $row['role'],
            'localisation' => $row['localisation'],
            'bio' => $row['bio'],
            'statut' => $new,
        ]);
        return ['ok' => (bool) $ok];
    }
}

/* ─── HTTP: forms submit here (action="../Controllers/UtilisateurController.php") ─── */
if (isset($_SERVER['SCRIPT_FILENAME']) && basename(__FILE__) === basename((string) $_SERVER['SCRIPT_FILENAME'])) {
    $viewsLogin = '../Views/users/login.html';

    $safeRedirect = static function (string $fallbackRelative): string {
        $r = trim((string) ($_POST['redirect'] ?? ''));
        if ($r === '' || strpos($r, '..') !== false || !preg_match('#^Views/[a-zA-Z0-9_./\-]+$#', $r)) {
            return $fallbackRelative;
        }
        return '../' . $r;
    };

    /* Discriminator: hidden form_action OR submit button name="submit" value="login|register|logout" */
    $fa = trim((string) ($_POST['form_action'] ?? $_POST['submit'] ?? ''));

    if ($fa === 'logout') {
        session_start();
        $_SESSION = [];
        session_destroy();
        header('Location: ' . $viewsLogin, true, 302);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'list_users') {
        session_start();
        $role = $_SESSION['role'] ?? '';
        $em   = $_SESSION['email'] ?? '';
        if (!(($role === 'admin') || Utilisateur::isAdminEmail($em))) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'forbidden']);
            exit;
        }
        $c = new UtilisateurController();
        $rows = $c->index();
        $out = [];
        foreach ($rows as $r) {
            $pb = Utilisateur::splitPhoneBio($r['bio']);
            $out[] = [
                'id'       => (int) $r['id'],
                'cin'      => $r['cin'],
                'email'    => $r['email'],
                'role'     => Utilisateur::dbRoleToUi($r['role']),
                'status'   => Utilisateur::dbStatutToUi($r['statut']),
                'date'     => substr($r['date_inscription'], 0, 10),
                'location' => $r['localisation'] ?? '',
                'phone'    => $pb['phone'],
                'bio'      => $pb['bio'],
                'is_seed'  => Utilisateur::isAdminEmail($r['email']),
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($out);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: ' . $viewsLogin, true, 302);
        exit;
    }

    $ctrl = new UtilisateurController();
    $dashUsers = '../Views/users/dashboard.html';

    $requireUserAdmin = static function () use ($viewsLogin): void {
        session_start();
        $role = $_SESSION['role'] ?? '';
        $em = $_SESSION['email'] ?? '';
        if (!(($role === 'admin') || Utilisateur::isAdminEmail($em))) {
            header('Location: ' . $viewsLogin . '?error=forbidden', true, 302);
            exit;
        }
    };

    if (in_array($fa, ['user_create', 'user_update', 'user_delete', 'user_toggle_ban'], true)) {
        $requireUserAdmin();

        if ($fa === 'user_create') {
            $cin = trim((string) ($_POST['cin'] ?? ''));
            $email = trim((string) ($_POST['email'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            $roleUi = trim((string) ($_POST['role'] ?? ''));
            $statusUi = trim((string) ($_POST['status'] ?? ''));
            $dateIn = trim((string) ($_POST['date_inscription'] ?? ''));
            $loc = trim((string) ($_POST['localisation'] ?? ''));
            $phone = trim((string) ($_POST['phone'] ?? ''));
            $bio = trim((string) ($_POST['bio'] ?? ''));

            if ($cin === '' || $email === '' || $password === '' || $dateIn === '' || $roleUi === '' || $statusUi === '') {
                header('Location: ' . $dashUsers . '?msg=missing', true, 302);
                exit;
            }
            if (Utilisateur::isAdminEmail($email)) {
                header('Location: ' . $dashUsers . '?msg=reserved_email', true, 302);
                exit;
            }
            $roleDb = Utilisateur::uiRoleToDb($roleUi);
            $statDb = Utilisateur::uiStatutToDb($statusUi);
            $mergedBio = Utilisateur::mergePhoneBio($phone, $bio);

            try {
                $ctrl->create([
                    'cin' => $cin,
                    'email' => $email,
                    'mot_de_passe' => $password,
                    'role' => $roleDb,
                    'date_inscription' => $dateIn,
                    'localisation' => $loc !== '' ? $loc : null,
                    'bio' => $mergedBio,
                    'statut' => $statDb,
                ]);
            } catch (PDOException $e) {
                $code = (int) ($e->errorInfo[1] ?? 0);
                if ($code === 1062) {
                    header('Location: ' . $dashUsers . '?msg=exists', true, 302);
                } else {
                    header('Location: ' . $dashUsers . '?msg=server', true, 302);
                }
                exit;
            }
            header('Location: ' . $dashUsers . '?msg=created', true, 302);
            exit;
        }

        if ($fa === 'user_update') {
            $id = (int) ($_POST['user_id'] ?? 0);
            if ($id <= 0) {
                header('Location: ' . $dashUsers . '?msg=invalid', true, 302);
                exit;
            }
            $existing = $ctrl->show($id);
            if (!$existing) {
                header('Location: ' . $dashUsers . '?msg=notfound', true, 302);
                exit;
            }

            $password = (string) ($_POST['password'] ?? '');
            $roleUi = trim((string) ($_POST['role'] ?? ''));
            $statusUi = trim((string) ($_POST['status'] ?? ''));
            $dateIn = trim((string) ($_POST['date_inscription'] ?? ''));
            $loc = trim((string) ($_POST['localisation'] ?? ''));
            $phone = trim((string) ($_POST['phone'] ?? ''));
            $bio = trim((string) ($_POST['bio'] ?? ''));

            $isSeed = Utilisateur::isAdminEmail($existing['email']);
            if ($isSeed) {
                $cin = $existing['cin'];
                $email = $existing['email'];
                $roleDb = 'admin';
            } else {
                $cin = trim((string) ($_POST['cin'] ?? ''));
                $email = trim((string) ($_POST['email'] ?? ''));
                if ($cin === '' || $email === '' || $roleUi === '' || $statusUi === '' || $dateIn === '') {
                    header('Location: ' . $dashUsers . '?msg=missing', true, 302);
                    exit;
                }
                if (Utilisateur::isAdminEmail($email) && !Utilisateur::isAdminEmail($existing['email'])) {
                    header('Location: ' . $dashUsers . '?msg=reserved_email', true, 302);
                    exit;
                }
                $roleDb = Utilisateur::uiRoleToDb($roleUi);
            }
            if ($statusUi === '' || $dateIn === '') {
                header('Location: ' . $dashUsers . '?msg=missing', true, 302);
                exit;
            }

            $statDb = Utilisateur::uiStatutToDb($statusUi);
            $mergedBio = Utilisateur::mergePhoneBio($phone, $bio);

            if ($password !== '' && strlen($password) < 6) {
                header('Location: ' . $dashUsers . '?msg=badpass', true, 302);
                exit;
            }

            $payload = [
                'cin' => $cin,
                'email' => $email,
                'mot_de_passe' => $password,
                'role' => $roleDb,
                'date_inscription' => $dateIn,
                'localisation' => $loc !== '' ? $loc : null,
                'bio' => $mergedBio,
                'statut' => $statDb,
            ];

            try {
                $ctrl->update($id, $payload);
            } catch (PDOException $e) {
                $code = (int) ($e->errorInfo[1] ?? 0);
                if ($code === 1062) {
                    header('Location: ' . $dashUsers . '?msg=exists', true, 302);
                } else {
                    header('Location: ' . $dashUsers . '?msg=server', true, 302);
                }
                exit;
            }

            header('Location: ' . $dashUsers . '?msg=updated', true, 302);
            exit;
        }

        if ($fa === 'user_delete') {
            $id = (int) ($_POST['user_id'] ?? 0);
            if ($id <= 0) {
                header('Location: ' . $dashUsers . '?msg=invalid', true, 302);
                exit;
            }
            $r = $ctrl->deleteUserIfAllowed($id);
            if (!$r['ok']) {
                $q = ($r['err'] ?? '') === 'protected' ? 'protected' : 'delete_fail';
                header('Location: ' . $dashUsers . '?msg=' . $q, true, 302);
                exit;
            }
            header('Location: ' . $dashUsers . '?msg=deleted', true, 302);
            exit;
        }

        if ($fa === 'user_toggle_ban') {
            $id = (int) ($_POST['user_id'] ?? 0);
            if ($id <= 0) {
                header('Location: ' . $dashUsers . '?msg=invalid', true, 302);
                exit;
            }
            $r = $ctrl->toggleBanIfAllowed($id);
            if (!$r['ok']) {
                $q = ($r['err'] ?? '') === 'protected' ? 'protected' : 'toggle_fail';
                header('Location: ' . $dashUsers . '?msg=' . $q, true, 302);
                exit;
            }
            header('Location: ' . $dashUsers . '?msg=toggled', true, 302);
            exit;
        }
    }

    if ($fa === 'login') {
        session_start();
        $captcha = trim((string) ($_POST['g-recaptcha-response'] ?? ''));
        if (!verify_recaptcha_v2($captcha)) {
            header('Location: ' . $viewsLogin . '?error=captcha', true, 302);
            exit;
        }
        $email = trim((string) ($_POST['email'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        if ($email === '' || $password === '') {
            header('Location: ' . $viewsLogin . '?error=missing', true, 302);
            exit;
        }
        $user = $ctrl->findByEmailForAuth($email);
        if ($user === false || !password_verify($password, $user['mot_de_passe'])) {
            header('Location: ' . $viewsLogin . '?error=invalid', true, 302);
            exit;
        }
        if (($user['statut'] ?? '') !== 'active') {
            header('Location: ' . $viewsLogin . '?error=inactive', true, 302);
            exit;
        }
        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['cin'] = $user['cin'];

        $redirectRaw = trim((string) ($_POST['redirect'] ?? ''));
        $wantsAdminArea = ($redirectRaw !== '' && stripos($redirectRaw, 'dashboard') !== false);
        $isAdminUser = Utilisateur::isAdminEmail($email) || (($user['role'] ?? '') === 'admin');
        if ($wantsAdminArea && !$isAdminUser) {
            header('Location: ' . $viewsLogin . '?error=admin_only', true, 302);
            exit;
        }

        header('Location: ' . $safeRedirect('../Views/Main.html'), true, 302);
        exit;
    }

    if ($fa === 'register') {
        $captcha = trim((string) ($_POST['g-recaptcha-response'] ?? ''));
        if (!verify_recaptcha_v2($captcha)) {
            header('Location: ' . $viewsLogin . '?error=captcha', true, 302);
            exit;
        }
        $cin = trim((string) ($_POST['cin'] ?? ''));
        $email = trim((string) ($_POST['email'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $role = (string) ($_POST['role'] ?? '');
        $dateInscription = trim((string) ($_POST['date_inscription'] ?? ''));
        $localisation = trim((string) ($_POST['localisation'] ?? ''));
        $bio = trim((string) ($_POST['bio'] ?? ''));

        if ($cin === '' || $email === '' || $password === '' || $dateInscription === '') {
            header('Location: ' . $viewsLogin . '?error=missing_fields', true, 302);
            exit;
        }
        if (!in_array($role, ['freelance', 'client'], true)) {
            header('Location: ' . $viewsLogin . '?error=role', true, 302);
            exit;
        }
        if (Utilisateur::isAdminEmail($email)) {
            header('Location: ' . $viewsLogin . '?error=reserved', true, 302);
            exit;
        }

        try {
            $ctrl->create([
                'cin' => $cin,
                'email' => $email,
                'mot_de_passe' => $password,
                'role' => $role,
                'date_inscription' => $dateInscription,
                'localisation' => $localisation !== '' ? $localisation : null,
                'bio' => $bio !== '' ? $bio : null,
                'statut' => 'active',
            ]);
        } catch (PDOException $e) {
            $code = (int) ($e->errorInfo[1] ?? 0);
            if ($code === 1062) {
                header('Location: ' . $viewsLogin . '?error=exists', true, 302);
            } else {
                header('Location: ' . $viewsLogin . '?error=server', true, 302);
            }
            exit;
        }

        header('Location: ' . $viewsLogin . '?registered=1', true, 302);
        exit;
    }

    header('Location: ' . $viewsLogin, true, 302);
    exit;
}
