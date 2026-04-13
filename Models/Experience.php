<?php

class Post {
    private $id;
    private $titre;
    private $contenu;
    private $user_id;
    private $categorie;
    private $tags;
    private $date_publication;
    private $statut;

    public function __construct(
        $id = null,
        $titre = '',
        $contenu = '',
        $user_id = null,
        $categorie = '',
        $tags = null,
        $date_publication = '',
        $statut = 'brouillon'
    ) {
        $this->id = $id;
        $this->titre = $titre;
        $this->contenu = $contenu;
        $this->user_id = $user_id;
        $this->categorie = $categorie;
        $this->tags = $tags;
        $this->date_publication = $date_publication;
        $this->statut = $statut;
    }

    public function getId() { return $this->id; }
    public function getTitre() { return $this->titre; }
    public function getContenu() { return $this->contenu; }
    public function getUserId() { return $this->user_id; }
    public function getCategorie() { return $this->categorie; }
    public function getTags() { return $this->tags; }
    public function getDatePublication() { return $this->date_publication; }
    public function getStatut() { return $this->statut; }

    public function setTitre($titre) { $this->titre = $titre; }
    public function setContenu($contenu) { $this->contenu = $contenu; }
    public function setUserId($user_id) { $this->user_id = $user_id; }
    public function setCategorie($categorie) { $this->categorie = $categorie; }
    public function setTags($tags) { $this->tags = $tags; }
    public function setStatut($statut) { $this->statut = $statut; }

    public static function packContenu($author, $content) {
        $meta = json_encode(['author' => $author], JSON_UNESCAPED_UNICODE);
        return $meta . '|||' . ($content ?? '');
    }

    public static function unpackContenu(?string $stored): array {
        $defaults = ['author'=>'','content'=>''];
        if (!$stored || strpos($stored, '|||') === false) {
            $defaults['content'] = $stored ?? '';
            return $defaults;
        }
        $parts = explode('|||', $stored, 2);
        $meta  = json_decode($parts[0], true);
        if (!is_array($meta)) {
            $defaults['content'] = $stored;
            return $defaults;
        }
        return array_merge($defaults, $meta, ['content' => $parts[1] ?? '']);
    }

    public static function uiStatusToDb($ui) {
        return $ui === 'Published' ? 'publie' : 'brouillon';
    }

    public static function dbStatusToUi($db) {
        return $db === 'publie' ? 'Published' : 'Draft';
    }
}

class Reponse {
    private $id;
    private $post_id;
    private $nom;
    private $email;
    private $contenu;
    private $date_reponse;

    public function __construct(
        $id = null,
        $post_id = null,
        $nom = '',
        $email = '',
        $contenu = '',
        $date_reponse = ''
    ) {
        $this->id = $id;
        $this->post_id = $post_id;
        $this->nom = $nom;
        $this->email = $email;
        $this->contenu = $contenu;
        $this->date_reponse = $date_reponse;
    }

    public function getId() { return $this->id; }
    public function getPostId() { return $this->post_id; }
    public function getNom() { return $this->nom; }
    public function getEmail() { return $this->email; }
    public function getContenu() { return $this->contenu; }
    public function getDateReponse() { return $this->date_reponse; }

    public function setPostId($v) { $this->post_id = $v; }
    public function setNom($v) { $this->nom = $v; }
    public function setEmail($v) { $this->email = $v; }
    public function setContenu($v) { $this->contenu = $v; }
}
