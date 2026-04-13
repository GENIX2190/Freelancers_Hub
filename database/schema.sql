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
-- Module: Experience (Yassine)
-- Tables: post, reponse
-- Depends on: utilisateur
-- ═══════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `reponse`;
DROP TABLE IF EXISTS `post`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `post` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `titre` VARCHAR(255) NOT NULL,
  `contenu` TEXT NOT NULL,
  `categorie` VARCHAR(255) NULL,
  `tags` VARCHAR(512) NULL,
  `date_publication` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` VARCHAR(50) NOT NULL DEFAULT 'brouillon',
  PRIMARY KEY (`id`),
  KEY `idx_post_user` (`user_id`),
  CONSTRAINT `fk_post_utilisateur`
    FOREIGN KEY (`user_id`) REFERENCES `utilisateur` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reponse` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id` INT UNSIGNED NOT NULL,
  `nom` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `contenu` TEXT NOT NULL,
  `date_reponse` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reponse_post` (`post_id`),
  CONSTRAINT `fk_reponse_post`
    FOREIGN KEY (`post_id`) REFERENCES `post` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
