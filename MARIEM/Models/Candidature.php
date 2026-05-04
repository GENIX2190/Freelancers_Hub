<?php

class Candidature {
    private $id;
    private $mission_id;
    private $user_id;
    private $date_candidature;
    private $statut;
    private $message;

    public function __construct(
        $id = null,
        $mission_id = null,
        $user_id = null,
        $date_candidature = '',
        $statut = 'en_attente',
        $message = null
    ) {
        $this->id = $id;
        $this->mission_id = $mission_id;
        $this->user_id = $user_id;
        $this->date_candidature = $date_candidature;
        $this->statut = $statut;
        $this->message = $message;
    }

    public function getId() { return $this->id; }
    public function getMissionId() { return $this->mission_id; }
    public function getUserId() { return $this->user_id; }
    public function getDateCandidature() { return $this->date_candidature; }
    public function getStatut() { return $this->statut; }
    public function getMessage() { return $this->message; }

    public function setMissionId($v) { $this->mission_id = $v; }
    public function setUserId($v) { $this->user_id = $v; }
    public function setStatut($v) { $this->statut = $v; }
    public function setMessage($v) { $this->message = $v; }

    public static function packMsg($name, $email, $phone, $experience, $rate, $message) {
        $meta = json_encode(['name' => $name, 'email' => $email, 'phone' => $phone, 'experience' => $experience, 'rate' => $rate]);
        return $meta . "\n---\n" . trim((string)$message);
    }

    public static function unpackMsg(?string $stored): array {
        $d = ['name' => '', 'email' => '', 'phone' => '', 'experience' => '', 'rate' => null, 'message' => ''];
        if (!$stored) return $d;
        $parts = explode("\n---\n", $stored, 2);
        if (count($parts) === 2 && ($m = json_decode($parts[0], true))) {
            return ['name' => $m['name'] ?? '', 'email' => $m['email'] ?? '', 'phone' => $m['phone'] ?? '', 'experience' => $m['experience'] ?? '', 'rate' => $m['rate'] ?? null, 'message' => trim($parts[1])];
        }
        return array_merge($d, ['message' => $stored]);
    }
}
