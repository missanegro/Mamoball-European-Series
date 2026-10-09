ALTER TABLE competitions ADD COLUMN description TEXT DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE competitions ADD COLUMN primary_color TEXT DEFAULT '#c2f970' NOT NULL;
--> statement-breakpoint
ALTER TABLE competitions ADD COLUMN secondary_color TEXT DEFAULT '#182218' NOT NULL;
--> statement-breakpoint
ALTER TABLE competitions ADD COLUMN logo_mime TEXT;
--> statement-breakpoint
ALTER TABLE competitions ADD COLUMN logo_data TEXT;
--> statement-breakpoint
ALTER TABLE competitions ADD COLUMN banner_mime TEXT;
--> statement-breakpoint
ALTER TABLE competitions ADD COLUMN banner_data TEXT;
--> statement-breakpoint
ALTER TABLE competitions ADD COLUMN season_optional TEXT DEFAULT '' NOT NULL;
