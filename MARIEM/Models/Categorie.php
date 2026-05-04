<?php

class Categorie {
    private $id;
    private $nom;
    private $description;

    public function __construct($id = null, $nom = '', $description = null) {
        $this->id = $id;
        $this->nom = $nom;
        $this->description = $description;
    }

    public function getId() { return $this->id; }
    public function getNom() { return $this->nom; }
    public function getDescription() { return $this->description; }

    public function setNom($v) { $this->nom = $v; }
    public function setDescription($v) { $this->description = $v; }

    public static function packDesc($icon, $desc) {
        return 'icon:' . (trim($icon) ?: '📌') . "\n" . trim((string)$desc);
    }

    public static function unpackDesc(?string $stored): array {
        if (!$stored) return ['icon' => '📌', 'description' => ''];
        if (preg_match('/^icon:(.+?)\n(.*)$/s', $stored, $m)) {
            return ['icon' => trim($m[1]), 'description' => trim($m[2])];
        }
        return ['icon' => '📌', 'description' => $stored];
    }
}
