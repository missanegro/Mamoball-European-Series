CREATE TABLE `audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text NOT NULL,
	`text` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `awards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`competition_id` integer NOT NULL,
	`type` text NOT NULL,
	`team_id` integer,
	`player_id` integer,
	`created` text NOT NULL,
	FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `award_unique` ON `awards` (`competition_id`,`type`);--> statement-breakpoint
CREATE TABLE `competitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`format` text NOT NULL,
	`mode` text NOT NULL,
	`capacity` integer NOT NULL,
	`season` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`rounds` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `competitions_name_unique` ON `competitions` (`name`);--> statement-breakpoint
CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`competition_id` integer NOT NULL,
	`team_id` integer NOT NULL,
	`group_name` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entry_unique` ON `entries` (`competition_id`,`team_id`);--> statement-breakpoint
CREATE TABLE `links` (
	`hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`competition_id` integer NOT NULL,
	`stage` text NOT NULL,
	`round` integer NOT NULL,
	`slot` integer NOT NULL,
	`group_name` text DEFAULT '' NOT NULL,
	`home_id` integer NOT NULL,
	`away_id` integer NOT NULL,
	`home_score` integer,
	`away_score` integer,
	`winner_id` integer,
	`scheduled` text,
	`version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`home_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`away_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fixture_unique` ON `matches` (`competition_id`,`stage`,`round`,`slot`);--> statement-breakpoint
CREATE INDEX `matches_comp` ON `matches` (`competition_id`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nick` text NOT NULL,
	`mamo` text NOT NULL,
	`team_id` integer,
	`position` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_mamo_unique` ON `players` (`mamo`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_nick_unique` ON `players` (`nick`);--> statement-breakpoint
CREATE TABLE `rates` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`player_id` integer NOT NULL,
	`status` text DEFAULT 'Pendente' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tag` text NOT NULL,
	`color` text NOT NULL,
	`region` text NOT NULL,
	`owner_id` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_name_unique` ON `teams` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `teams_tag_unique` ON `teams` (`tag`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text,
	`discord_id` text,
	`discord_name` text,
	`nick` text DEFAULT '' NOT NULL,
	`mamo` text DEFAULT '' NOT NULL,
	`player_id` integer,
	`owner` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_site_id_unique` ON `users` (`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unique` ON `users` (`discord_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_player_id_unique` ON `users` (`player_id`);