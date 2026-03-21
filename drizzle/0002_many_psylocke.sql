CREATE TABLE `knowledge_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int,
	`name` varchar(128) NOT NULL,
	`subject` varchar(64) NOT NULL,
	`description` text,
	`mastery` int NOT NULL DEFAULT 30,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`mentionCount` int NOT NULL DEFAULT 1,
	`lastMentionedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_points_id` PRIMARY KEY(`id`)
);
