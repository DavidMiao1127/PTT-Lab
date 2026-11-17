CREATE TABLE `imported_pairs` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`author` text NOT NULL,
	`domain` text NOT NULL,
	`level` text NOT NULL,
	`method` text NOT NULL,
	`model` text NOT NULL,
	`run_id` text NOT NULL,
	`generated_text` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `imported_pairs_method_run` ON `imported_pairs` (`item_id`,`method`,`model`,`run_id`);--> statement-breakpoint
CREATE TABLE `imported_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);
