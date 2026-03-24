RENAME TABLE `user` TO `users`;

ALTER TABLE `users`
  DROP INDEX `User_name_key`,
  ADD COLUMN `email` VARCHAR(191) NULL,
  ADD COLUMN `password_hash` VARCHAR(255) NULL,
  ADD COLUMN `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';

UPDATE `users`
SET
  `email` = CONCAT('legacy-user-', `id`, '@example.local'),
  `password_hash` = '$2b$10$as55V/6o.ETnpyytrL.pN.5xEZ.0g/bncO1aNekF2bZXNpP4.W.tW'
WHERE `email` IS NULL OR `password_hash` IS NULL;

ALTER TABLE `users`
  MODIFY `email` VARCHAR(191) NOT NULL,
  MODIFY `password_hash` VARCHAR(255) NOT NULL,
  ADD UNIQUE INDEX `users_email_key`(`email`);
