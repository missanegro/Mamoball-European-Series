ALTER TABLE competitions ADD COLUMN min_players INTEGER NOT NULL DEFAULT 5;
--> statement-breakpoint
ALTER TABLE competitions ADD COLUMN max_players INTEGER NOT NULL DEFAULT 10;
--> statement-breakpoint
ALTER TABLE team_invites ADD COLUMN competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE team_invites ADD COLUMN reviewed_by TEXT;
--> statement-breakpoint
ALTER TABLE team_invites ADD COLUMN reviewed_at TEXT;
--> statement-breakpoint
CREATE INDEX team_invites_team_comp_status ON team_invites(team_id,competition_id,status);
--> statement-breakpoint
CREATE INDEX player_teams_competition ON player_teams(competition_id,team_id);
--> statement-breakpoint
CREATE INDEX player_teams_player ON player_teams(player_id,competition_id);
