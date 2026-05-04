<?php

class Avis {
    private $id;
    private $formation_id;
    private $user_id;
    private $note;
    private $commentaire;
    private $date_avis;

    public function __construct(
        $id = null,
        $formation_id = null,
        $user_id = null,
        $note = null,
        $commentaire = null,
        $date_avis = ''
    ) {
        $this->id = $id;
        $this->formation_id = $formation_id;
        $this->user_id = $user_id;
        $this->note = $note;
        $this->commentaire = $commentaire;
        $this->date_avis = $date_avis;
    }

    public function getId() { return $this->id; }
    public function getFormationId() { return $this->formation_id; }
    public function getUserId() { return $this->user_id; }
    public function getNote() { return $this->note; }
    public function getCommentaire() { return $this->commentaire; }
    public function getDateAvis() { return $this->date_avis; }

    public function setFormationId($v) { $this->formation_id = $v; }
    public function setUserId($v) { $this->user_id = $v; }
    public function setNote($v) { $this->note = $v; }
    public function setCommentaire($v) { $this->commentaire = $v; }

    public static function packComment($student, $comment) {
        $meta = json_encode(['student' => $student], JSON_UNESCAPED_UNICODE);
        return $meta . '|||' . ($comment ?? '');
    }

    public static function unpackComment(?string $stored): array {
        $defaults = ['student'=>'','comment'=>''];
        if (!$stored || strpos($stored, '|||') === false) {
            $defaults['comment'] = $stored ?? '';
            return $defaults;
        }
        $parts = explode('|||', $stored, 2);
        $meta  = json_decode($parts[0], true);
        if (!is_array($meta)) {
            $defaults['comment'] = $stored;
            return $defaults;
        }
        return array_merge($defaults, $meta, ['comment' => $parts[1] ?? '']);
    }
}
