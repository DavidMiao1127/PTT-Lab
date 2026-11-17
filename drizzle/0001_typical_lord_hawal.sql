CREATE INDEX `answers_session` ON `answers` (`session_id`);--> statement-breakpoint
CREATE INDEX `events_session_pair` ON `events` (`session_id`,`pair_id`);--> statement-breakpoint
CREATE INDEX `evidence_session` ON `evidence` (`session_id`);--> statement-breakpoint
CREATE INDEX `visits_session_pair` ON `visits` (`session_id`,`pair_id`);