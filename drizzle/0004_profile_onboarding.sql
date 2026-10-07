ALTER TABLE `users` ADD `nick_changed_at` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `ingame_flag` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `flag_request_at` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_status` text DEFAULT 'complete' NOT NULL;
--> statement-breakpoint
CREATE TABLE `flag_requests` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `user_id` text NOT NULL, `old_flag` text NOT NULL, `new_flag` text NOT NULL, `status` text DEFAULT 'Pendente' NOT NULL, `created` text NOT NULL, `reviewed_by` text, `reviewed_at` text);
--> statement-breakpoint
CREATE INDEX `flag_requests_user` ON `flag_requests` (`user_id`,`status`);
