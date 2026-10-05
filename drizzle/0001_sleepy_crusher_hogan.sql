DROP INDEX `players_mamo_unique`;--> statement-breakpoint
DROP INDEX `players_nick_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `players_mamo_unique` ON `players` (lower("mamo"));--> statement-breakpoint
CREATE UNIQUE INDEX `players_nick_unique` ON `players` (lower("nick"));--> statement-breakpoint
DROP INDEX `teams_name_unique`;--> statement-breakpoint
DROP INDEX `teams_tag_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `teams_name_unique` ON `teams` (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX `teams_tag_unique` ON `teams` (lower("tag"));--> statement-breakpoint
CREATE UNIQUE INDEX `one_pending_request_per_user` ON `requests` (`user_id`) WHERE "requests"."status" = 'Pendente';