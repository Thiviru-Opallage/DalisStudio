-- AlterTable: JWT revocation support
ALTER TABLE `users` ADD COLUMN `token_version` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: analytics dashboard performance
CREATE INDEX `visits_visited_at_idx` ON `visits`(`visited_at`);

-- CreateIndex: unread count and ordered listing
CREATE INDEX `contact_messages_is_read_idx` ON `contact_messages`(`is_read`);
CREATE INDEX `contact_messages_created_at_idx` ON `contact_messages`(`created_at`);
