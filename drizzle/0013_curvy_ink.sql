CREATE TABLE `api_usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int,
	`providerName` varchar(128) NOT NULL,
	`category` varchar(32) NOT NULL,
	`model` varchar(128),
	`caller` varchar(64) NOT NULL,
	`userId` int,
	`inputTokens` int DEFAULT 0,
	`outputTokens` int DEFAULT 0,
	`totalTokens` int DEFAULT 0,
	`estimatedCostCny` decimal(10,6) DEFAULT '0',
	`durationMs` int,
	`success` boolean NOT NULL DEFAULT true,
	`errorMessage` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_usage_logs_id` PRIMARY KEY(`id`)
);
