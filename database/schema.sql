-- ═══════════════════════════════════════
-- Module: Utilisateurs (Fatima)
-- Tables: utilisateur
-- ═══════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `utilisateur`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `utilisateur` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cin` VARCHAR(64) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `role` ENUM('freelance','client','admin') NOT NULL DEFAULT 'freelance',
  `date_inscription` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `localisation` VARCHAR(255) NULL,
  `bio` TEXT NULL,
  `statut` ENUM('active','banned','inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_utilisateur_cin` (`cin`),
  UNIQUE KEY `uk_utilisateur_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compte admin par defaut
INSERT INTO `utilisateur` (`cin`, `email`, `mot_de_passe`, `role`, `localisation`, `bio`, `statut`)
VALUES (
  'ADMIN001',
  'admin@admiin.com',
  '$2y$10$dXzwmiiCqvYgNhPB33Cot.q6DuLMIB.3faFNDeqPwN377yez8TAH.',
  'admin',
  NULL, NULL, 'active'
);
-- ═══════════════════════════════════════
-- Module: Projets (Ilyes)
-- Tables: projet, tache
-- Depends on: utilisateur
-- ═══════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `tache`;
DROP TABLE IF EXISTS `projet`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `projet` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` VARCHAR(64) NOT NULL DEFAULT 'en_cours',
  `user_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_projet_user` (`user_id`),
  CONSTRAINT `fk_projet_utilisateur`
    FOREIGN KEY (`user_id`) REFERENCES `utilisateur` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tache` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `projet_id` INT UNSIGNED NOT NULL,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `statut` VARCHAR(64) NOT NULL DEFAULT 'a_faire',
  `priorite` VARCHAR(64) NOT NULL DEFAULT 'normale',
  `date_echeance` DATE NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tache_projet` (`projet_id`),
  CONSTRAINT `fk_tache_projet`
    FOREIGN KEY (`projet_id`) REFERENCES `projet` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
