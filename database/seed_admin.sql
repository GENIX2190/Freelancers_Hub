-- Admin panel login only (email + password both: admin@admiin.com)
USE `freelence_hub`;

DELETE FROM `utilisateur` WHERE `email` IN ('admin@admin.com', 'admin@admiin.com');

INSERT INTO `utilisateur` (`cin`, `email`, `mot_de_passe`, `role`, `date_inscription`, `localisation`, `bio`, `statut`)
VALUES (
  'ADMIN001',
  'admin@admiin.com',
  '$2y$10$dXzwmiiCqvYgNhPB33Cot.q6DuLMIB.3faFNDeqPwN377yez8TAH.',
  'admin',
  NOW(),
  NULL,
  NULL,
  'active'
);
