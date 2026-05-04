<?php
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Avis.php';

class AvisController {
    private $pdo;

    public function __construct() {
        $this->pdo = getConnection();
    }

    // Jointure : afficher avis avec email utilisateur et titre formation
    public function indexAvecJointure() {
        $stmt = $this->pdo->query(
            "SELECT u.email, f.titre, a.note, a.commentaire, a.date_avis
             FROM avis a
             JOIN utilisateur u ON a.user_id = u.id
             JOIN formation f ON a.formation_id = f.id
             ORDER BY a.date_avis DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function index() {
    $stmt = $this->pdo->query(
        "SELECT a.id, a.note AS rating, a.commentaire AS comment, a.date_avis AS date,
                u.email AS student,
                f.titre AS courseTitle
         FROM avis a
         JOIN utilisateur u ON a.user_id = u.id
         JOIN formation f ON a.formation_id = f.id
         ORDER BY a.date_avis DESC"
    );
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

    public function show($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM `avis` WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO `avis` (formation_id, user_id, note, commentaire, date_avis)
             VALUES (?, ?, ?, ?, COALESCE(?, NOW()))"
        );
        $stmt->execute([
            $data['formation_id'],
            $data['user_id'],
            $data['note'],
            $data['commentaire'] ?? null,
            $data['date_avis'] ?? null,
        ]);
        return $this->pdo->lastInsertId();
    }

    public function update($id, $data) {
        $stmt = $this->pdo->prepare(
            "UPDATE `avis` SET formation_id=?, user_id=?, note=?, commentaire=? WHERE id=?"
        );
        return $stmt->execute([
            $data['formation_id'],
            $data['user_id'],
            $data['note'],
            $data['commentaire'] ?? null,
            $id,
        ]);
    }

    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM `avis` WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
