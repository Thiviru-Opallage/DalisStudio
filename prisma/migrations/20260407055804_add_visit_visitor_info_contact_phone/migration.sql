-- AlterTable
ALTER TABLE `contact_messages` ADD COLUMN `phone` VARCHAR(30) NULL;

-- AlterTable
ALTER TABLE `visits` ADD COLUMN `country` VARCHAR(100) NULL,
    ADD COLUMN `device_type` VARCHAR(20) NULL,
    ADD COLUMN `visitor_email` VARCHAR(255) NULL,
    ADD COLUMN `visitor_name` VARCHAR(255) NULL;
