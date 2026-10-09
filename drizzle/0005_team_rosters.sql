ALTER TABLE `teams` ADD `logo_mime` text;
--> statement-breakpoint
ALTER TABLE `teams` ADD `logo_data` text;
--> statement-breakpoint
ALTER TABLE `teams` ADD `secondary_color` text DEFAULT '#1b241b' NOT NULL;
--> statement-breakpoint
CREATE TABLE `team_members` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `team_id` integer NOT NULL, `player_id` integer NOT NULL, `status` text DEFAULT 'active' NOT NULL, `created` text NOT NULL, FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE, FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_member_unique` ON `team_members` (`team_id`,`player_id`);
--> statement-breakpoint
CREATE TABLE `team_invites` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `team_id` integer NOT NULL, `player_id` integer NOT NULL, `status` text DEFAULT 'Pendente' NOT NULL, `created` text NOT NULL, FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE, FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE);
--> statement-breakpoint
CREATE INDEX `team_invites_player` ON `team_invites` (`player_id`,`status`);
--> statement-breakpoint
CREATE TABLE `player_teams` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `player_id` integer NOT NULL, `team_id` integer NOT NULL, `competition_id` integer, `created` text NOT NULL, FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE, FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE, FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON DELETE CASCADE);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_team_competition_unique` ON `player_teams` (`player_id`,`team_id`,`competition_id`);
