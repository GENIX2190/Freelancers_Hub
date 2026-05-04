<?php

class Formation {
    private $id;
    private $titre;
    private $description;
    private $categorie;
    private $duree;
    private $niveau;
    private $prix;
    private $image;
    private $date_creation;

    public function __construct(
        $id = null,
        $titre = '',
        $description = '',
        $categorie = '',
        $duree = '',
        $niveau = '',
        $prix = null,
        $image = null,
        $date_creation = ''
    ) {
        $this->id = $id;
        $this->titre = $titre;
        $this->description = $description;
        $this->categorie = $categorie;
        $this->duree = $duree;
        $this->niveau = $niveau;
        $this->prix = $prix;
        $this->image = $image;
        $this->date_creation = $date_creation;
    }

    public function getId() { return $this->id; }
    public function getTitre() { return $this->titre; }
    public function getDescription() { return $this->description; }
    public function getCategorie() { return $this->categorie; }
    public function getDuree() { return $this->duree; }
    public function getNiveau() { return $this->niveau; }
    public function getPrix() { return $this->prix; }
    public function getImage() { return $this->image; }
    public function getDateCreation() { return $this->date_creation; }

    public function setTitre($titre) { $this->titre = $titre; }
    public function setDescription($description) { $this->description = $description; }
    public function setCategorie($categorie) { $this->categorie = $categorie; }
    public function setDuree($duree) { $this->duree = $duree; }
    public function setNiveau($niveau) { $this->niveau = $niveau; }
    public function setPrix($prix) { $this->prix = $prix; }
    public function setImage($image) { $this->image = $image; }

    public static function packDesc($instructor, $hoursDone, $status, $rating, $startDate, $desc) {
        $meta = json_encode([
            'instructor' => $instructor,
            'hoursDone'  => (int)$hoursDone,
            'status'     => $status,
            'rating'     => $rating !== '' && $rating !== null ? (float)$rating : null,
            'startDate'  => $startDate,
        ], JSON_UNESCAPED_UNICODE);
        return $meta . '|||' . ($desc ?? '');
    }

    public static function unpackDesc(?string $stored): array {
        $defaults = ['instructor'=>'','hoursDone'=>0,'status'=>'Planned','rating'=>null,'startDate'=>'','description'=>''];
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
}
