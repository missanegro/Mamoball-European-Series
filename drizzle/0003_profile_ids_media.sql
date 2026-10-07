ALTER TABLE `users` ADD `mamo_set_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `mamo_request_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_banner` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_kind` text DEFAULT 'discord' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `banner_kind` text DEFAULT 'preset' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `banner_preset` text DEFAULT 'lime' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `media_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_mamo_unique` ON `users` (lower(`mamo`)) WHERE `mamo`<>'';--> statement-breakpoint
CREATE TABLE `id_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`old_mamo` text NOT NULL,
	`new_mamo` text NOT NULL,
	`status` text DEFAULT 'Pendente' NOT NULL,
	`created` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE INDEX `id_requests_user` ON `id_requests` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `user_media` (
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`mime` text NOT NULL,
	`data` text NOT NULL,
	`updated` text NOT NULL,
	PRIMARY KEY(`user_id`,`kind`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE INDEX `players_team_id` ON `players` (`team_id`);
