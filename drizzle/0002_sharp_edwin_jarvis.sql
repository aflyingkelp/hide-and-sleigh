CREATE TABLE `traps` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`round` integer NOT NULL,
	`x` real NOT NULL,
	`z` real NOT NULL,
	`placed` real NOT NULL,
	`victim` text,
	`triggered` real,
	`result` text,
	`resolved` real,
	FOREIGN KEY (`room`) REFERENCES `rooms`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `traps_room_idx` ON `traps` (`room`,`round`);--> statement-breakpoint
ALTER TABLE `players` ADD `taunt` text;