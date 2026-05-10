<?php

class Mission {
    private $id;
    private $titre;
    private $description;
    private $budget;
    private $deadline;
    private $statut;
    private $date_creation;
    private $categorie_id;

    public function __construct(
        $id = null,
        $titre = '',
        $description = null,
        $budget = null,
        $deadline = null,
        $statut = 'ouverte',
        $date_creation = '',
        $categorie_id = null
    ) {
        $this->id = $id;
        $this->titre = $titre;
        $this->description = $description;
        $this->budget = $budget;
        $this->deadline = $deadline;
        $this->statut = $statut;
        $this->date_creation = $date_creation;
        $this->categorie_id = $categorie_id;
    }

    public function getId() { return $this->id; }
    public function getTitre() { return $this->titre; }
    public function getDescription() { return $this->description; }
    public function getBudget() { return $this->budget; }
    public function getDeadline() { return $this->deadline; }
    public function getStatut() { return $this->statut; }
    public function getDateCreation() { return $this->date_creation; }
    public function getCategorieId() { return $this->categorie_id; }

    public function setTitre($v) { $this->titre = $v; }
    public function setDescription($v) { $this->description = $v; }
    public function setBudget($v) { $this->budget = $v; }
    public function setDeadline($v) { $this->deadline = $v; }
    public function setStatut($v) { $this->statut = $v; }
    public function setCategorieId($v) { $this->categorie_id = $v; }

    public static function packDesc($client, $progress, $priority, $desc) {
        $meta = json_encode(['client' => $client, 'progress' => (int)$progress, 'priority' => $priority]);
        return $meta . "\n---\n" . trim((string)$desc);
    }

    public static function unpackDesc(?string $stored): array {
        $d = ['client' => '', 'progress' => 0, 'priority' => 'Normal', 'description' => ''];
        if (!$stored) return $d;
        $parts = explode("\n---\n", $stored, 2);
        if (count($parts) === 2 && ($m = json_decode($parts[0], true))) {
            return ['client' => $m['client'] ?? '', 'progress' => (int)($m['progress'] ?? 0), 'priority' => $m['priority'] ?? 'Normal', 'description' => trim($parts[1])];
        }
        return array_merge($d, ['description' => $stored]);
    }
}
