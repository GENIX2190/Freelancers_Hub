<?php

require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Candidature.php';

class CandidatureController {

    private $pdo;

    public function __construct() {
        $this->pdo = getConnection();
    }

    public function index() {
        $stmt = $this->pdo->query("SELECT * FROM candidature ORDER BY date_candidature DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function show($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM candidature WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $stmt = $this->pdo->prepare(
            "INSERT INTO candidature (mission_id, user_id, date_candidature, statut, message)
             VALUES (?, ?, COALESCE(?, NOW()), ?, ?)"
        );
        $stmt->execute([
            $data['mission_id'],
            $data['user_id'],
            $data['date_candidature'] ?? null,
            $data['statut'] ?? 'en_attente',
            $data['message'] ?? null,
        ]);
        return $this->pdo->lastInsertId();
    }

    public function update($id, $data) {
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

    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM candidature WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
