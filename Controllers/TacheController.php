<?php

require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Tache.php';

class TacheController {

    private $pdo;

    public function __construct() {
        $this->pdo = getConnection();
    }

    public function index() {
        $stmt = $this->pdo->query("SELECT * FROM tache ORDER BY id DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function show($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM tache WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
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

    public function update($id, $data) {
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

    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM tache WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
