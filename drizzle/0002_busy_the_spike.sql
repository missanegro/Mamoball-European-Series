CREATE TABLE `oauth_flows` (
	`hash` text PRIMARY KEY NOT NULL,
	`site_id` text,
	`user_id` text,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `web_sessions` (
	`hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`access_cipher` text NOT NULL,
	`expires` integer NOT NULL,
	`verified_at` integer NOT NULL,
	`verified_guild` text DEFAULT '' NOT NULL,
	`roles` text DEFAULT '[]' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
