ALTER TABLE `conversations` ADD `startedAt` timestamp;--> statement-breakpoint
ALTER TABLE `conversations` ADD `endedAt` timestamp;--> statement-breakpoint
ALTER TABLE `conversations` ADD `durationMinutes` int DEFAULT 0 NOT NULL;