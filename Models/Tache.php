<?php

class Tache {
    private $id;
    private $projet_id;
    private $titre;
    private $description;
    private $statut;
    private $priorite;
    private $date_echeance;

    public function __construct(
        $id = null,
        $projet_id = null,
        $titre = '',
        $description = null,
        $statut = 'a_faire',
        $priorite = 'normale',
        $date_echeance = null
    ) {
        $this->id = $id;
        $this->projet_id = $projet_id;
        $this->titre = $titre;
        $this->description = $description;
        $this->statut = $statut;
        $this->priorite = $priorite;
        $this->date_echeance = $date_echeance;
    }

    public function getId() { return $this->id; }
    public function getProjetId() { return $this->projet_id; }
    public function getTitre() { return $this->titre; }
    public function getDescription() { return $this->description; }
    public function getStatut() { return $this->statut; }
    public function getPriorite() { return $this->priorite; }
    public function getDateEcheance() { return $this->date_echeance; }

    public function setProjetId($v) { $this->projet_id = $v; }
    public function setTitre($v) { $this->titre = $v; }
    public function setDescription($v) { $this->description = $v; }
    public function setStatut($v) { $this->statut = $v; }
    public function setPriorite($v) { $this->priorite = $v; }
    public function setDateEcheance($v) { $this->date_echeance = $v; }

    public static function packDesc($assigned, $notes) {
        $meta = json_encode(['assigned' => $assigned], JSON_UNESCAPED_UNICODE);
        return $meta . '|||' . ($notes ?? '');
    }

    public static function unpackDesc(?string $stored): array {
        $defaults = ['assigned'=>'','notes'=>''];
        if (!$stored || strpos($stored, '|||') === false) {
            $defaults['notes'] = $stored ?? '';
            return $defaults;
        }
        $parts = explode('|||', $stored, 2);
        $meta  = json_decode($parts[0], true);
        if (!is_array($meta)) {
            $defaults['notes'] = $stored;
            return $defaults;
        }
        return array_merge($defaults, $meta, ['notes' => $parts[1] ?? '']);
    }
}
