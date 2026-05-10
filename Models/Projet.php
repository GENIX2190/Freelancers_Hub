<?php

class Projet {
    private $id;
    private $titre;
    private $description;
    private $date_creation;
    private $statut;
    private $user_id;

    public function __construct(
        $id = null,
        $titre = '',
        $description = null,
        $date_creation = '',
        $statut = 'en_cours',
        $user_id = null
    ) {
        $this->id = $id;
        $this->titre = $titre;
        $this->description = $description;
        $this->date_creation = $date_creation;
        $this->statut = $statut;
        $this->user_id = $user_id;
    }

    public function getId() { return $this->id; }
    public function getTitre() { return $this->titre; }
    public function getDescription() { return $this->description; }
    public function getDateCreation() { return $this->date_creation; }
    public function getStatut() { return $this->statut; }
    public function getUserId() { return $this->user_id; }

    public function setTitre($v) { $this->titre = $v; }
    public function setDescription($v) { $this->description = $v; }
    public function setStatut($v) { $this->statut = $v; }
    public function setUserId($v) { $this->user_id = $v; }

    public static function packDesc($category, $client, $progress, $priority, $start, $end, $desc) {
        $meta = json_encode([
            'category' => $category,
            'client'   => $client,
            'progress' => (int)$progress,
            'priority' => $priority,
            'start'    => $start,
            'end'      => $end,
        ], JSON_UNESCAPED_UNICODE);
        return $meta . '|||' . ($desc ?? '');
    }

    public static function unpackDesc(?string $stored): array {
        $defaults = ['category'=>'','client'=>'','progress'=>0,'priority'=>'Normal','start'=>'','end'=>'','description'=>''];
        if (!$stored || strpos($stored, '|||') === false) {
            $defaults['description'] = $stored ?? '';
            return $defaults;
        }
        $parts = explode('|||', $stored, 2);
        $meta  = json_decode($parts[0], true);
        if (!is_array($meta)) {
            $defaults['description'] = $stored;
            return $defaults;
        }
        return array_merge($defaults, $meta, ['description' => $parts[1] ?? '']);
    }

    public static function uiStatusToDb($ui) {
        $map = ['Planning'=>'en_attente','In Progress'=>'en_cours','Review'=>'en_revision','Completed'=>'termine','Cancelled'=>'annule'];
        return $map[$ui] ?? $ui;
    }

    public static function dbStatusToUi($db) {
        $map = ['en_attente'=>'Planning','en_cours'=>'In Progress','en_revision'=>'Review','termine'=>'Completed','annule'=>'Cancelled'];
        return $map[$db] ?? $db;
    }
}
