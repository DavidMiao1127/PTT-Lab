CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`pair_id` text NOT NULL,
	`choice` text NOT NULL,
	`confidence` integer NOT NULL,
	`active_ms` integer NOT NULL,
	`submitted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`pair_id` text NOT NULL,
	`payload` text NOT NULL,
	`received_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`pair_id` text NOT NULL,
	`payload` text NOT NULL,
	`submitted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text,
	`profile` text NOT NULL,
	`items` text NOT NULL,
	`status` text NOT NULL,
	`selected` text NOT NULL,
	`summary` text,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`pair_id` text NOT NULL,
	`opened_at` integer NOT NULL
);
