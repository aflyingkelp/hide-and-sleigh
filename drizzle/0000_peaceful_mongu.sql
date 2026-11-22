CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`room` text NOT NULL,
	`name` text NOT NULL,
	`x` real DEFAULT 0 NOT NULL,
	`z` real DEFAULT 0 NOT NULL,
	`yaw` real DEFAULT 0 NOT NULL,
	`pitch` real DEFAULT 0 NOT NULL,
	`prop` integer DEFAULT -1 NOT NULL,
	`caught` integer DEFAULT 0 NOT NULL,
	`seen` real NOT NULL,
	`light` integer DEFAULT 0 NOT NULL,
	`tagged` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `rooms`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `players_room_idx` ON `players` (`room`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`seeker` text,
	`phase` text DEFAULT 'lobby' NOT NULL,
	`starts` real DEFAULT 0 NOT NULL,
	`expires` real NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`winner` text
);
