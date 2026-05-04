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
-- Module: Formations (Achref)
-- Tables: formation, evaluation_formation
-- Depends on: utilisateur
-- ═══════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `evaluation_formation`;
DROP TABLE IF EXISTS `formation`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `formation` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `duree` VARCHAR(64) NULL,
  `prix` DECIMAL(12,2) NULL,
  `niveau` VARCHAR(64) NULL,
  `categorie` VARCHAR(128) NULL,
  `image` VARCHAR(512) NULL,
  `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evaluation_formation` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `formation_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `note` TINYINT UNSIGNED NOT NULL,
  `commentaire` TEXT NULL,
  `date_avis` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_eval_formation` (`formation_id`),
  KEY `idx_eval_user` (`user_id`),
  CONSTRAINT `fk_eval_formation`
    FOREIGN KEY (`formation_id`) REFERENCES `formation` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_eval_utilisateur`
    FOREIGN KEY (`user_id`) REFERENCES `utilisateur` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
