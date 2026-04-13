<?php

class Utilisateur {

    /** Single admin account for the admin area (matches seed SQL). */
    public const ADMIN_EMAIL = 'admin@admiin.com';

    private $id;
    private $cin;
    private $email;
    private $mot_de_passe;
    private $role;
    private $date_inscription;
    private $localisation;
    private $bio;
    private $statut;

    public function __construct(
        $id = null,
        $cin = '',
        $email = '',
        $mot_de_passe = '',
        $role = 'freelance',
        $date_inscription = '',
        $localisation = null,
        $bio = null,
        $statut = 'active'
    ) {
        $this->id = $id;
        $this->cin = $cin;
        $this->email = $email;
        $this->mot_de_passe = $mot_de_passe;
        $this->role = $role;
        $this->date_inscription = $date_inscription;
        $this->localisation = $localisation;
        $this->bio = $bio;
        $this->statut = $statut;
    }

    public function getId() { return $this->id; }
    public function getCin() { return $this->cin; }
    public function getEmail() { return $this->email; }
    public function getMotDePasse() { return $this->mot_de_passe; }
    public function getRole() { return $this->role; }
    public function getDateInscription() { return $this->date_inscription; }
    public function getLocalisation() { return $this->localisation; }
    public function getBio() { return $this->bio; }
    public function getStatut() { return $this->statut; }

    public function setCin($v) { $this->cin = $v; }
    public function setEmail($v) { $this->email = $v; }
    public function setMotDePasse($v) { $this->mot_de_passe = $v; }
    public function setRole($v) { $this->role = $v; }
    public function setLocalisation($v) { $this->localisation = $v; }
    public function setBio($v) { $this->bio = $v; }
    public function setStatut($v) { $this->statut = $v; }

    public static function isAdminEmail(string $email): bool {
        return strcasecmp(trim($email), self::ADMIN_EMAIL) === 0;
    }

    public static function mergePhoneBio(?string $phone, ?string $bio): ?string {
        $phone = trim((string) $phone);
        $bio = trim((string) $bio);
        if ($phone !== '') {
            return 'Phone: ' . $phone . "\n\n" . ($bio !== '' ? $bio : '');
        }
        return $bio !== '' ? $bio : null;
    }

    /** @return array{phone:string,bio:string} */
    public static function splitPhoneBio(?string $stored): array {
        if ($stored === null || $stored === '') {
            return ['phone' => '', 'bio' => ''];
        }
        if (preg_match('/^Phone:\s*(.+?)\r?\n\r?\n(.*)$/s', $stored, $m)) {
            return ['phone' => trim($m[1]), 'bio' => trim($m[2])];
        }
        return ['phone' => '', 'bio' => $stored];
    }

    public static function uiRoleToDb(string $r): string {
        $m = ['Freelancer' => 'freelance', 'Client' => 'client', 'Admin' => 'admin'];
        return $m[$r] ?? 'freelance';
    }

    public static function dbRoleToUi(string $r): string {
        $m = ['admin' => 'Admin', 'freelance' => 'Freelancer', 'client' => 'Client'];
        return $m[$r] ?? $r;
    }

    public static function uiStatutToDb(string $s): string {
        $m = ['Active' => 'active', 'Banned' => 'banned', 'Inactive' => 'inactive'];
        return $m[$s] ?? 'active';
    }

    public static function dbStatutToUi(string $s): string {
        $m = ['active' => 'Active', 'banned' => 'Banned', 'inactive' => 'Inactive'];
        return $m[$s] ?? $s;
    }
}
