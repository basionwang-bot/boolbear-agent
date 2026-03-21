CREATE TABLE `parent_share_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`label` varchar(128),
	`isActive` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`viewCount` int NOT NULL DEFAULT 0,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_share_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `parent_share_tokens_token_unique` UNIQUE(`token`)
);
