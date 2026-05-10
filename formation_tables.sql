-- Formation module (integrated from Freelancers_Hub formation branch).
-- Requires existing `utilisateur` table. Run once in phpMyAdmin or mysql CLI:

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `formation` (
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

CREATE TABLE IF NOT EXISTS `evaluation_formation` (
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

SET FOREIGN_KEY_CHECKS = 1;
