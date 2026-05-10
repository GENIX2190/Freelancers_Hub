<?php

require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/Models/Categorie.php';

class CategorieController {

    private $pdo;

    public function __construct() {
        $this->pdo = getConnection();
    }

    public function index() {
        $stmt = $this->pdo->query("SELECT * FROM categorie ORDER BY id DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function show($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM categorie WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $stmt = $this->pdo->prepare("INSERT INTO categorie (nom, description) VALUES (?, ?)");
        $stmt->execute([$data['nom'], $data['description'] ?? null]);
        return $this->pdo->lastInsertId();
    }

    public function update($id, $data) {
        $stmt = $this->pdo->prepare("UPDATE categorie SET nom=?, description=? WHERE id=?");
        return $stmt->execute([$data['nom'], $data['description'] ?? null, $id]);
    }

    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM categorie WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
