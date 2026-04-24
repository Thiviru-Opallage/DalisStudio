-- AlterTable
ALTER TABLE `users` ADD COLUMN `email_notifications` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `visits` ADD COLUMN `is_bounce` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `session_duration` INTEGER NULL;
