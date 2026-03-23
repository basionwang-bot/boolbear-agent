CREATE TABLE `ai_provider_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('llm','tts','asr','image','video','web_search') NOT NULL,
	`providerId` varchar(64) NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`apiKeyEncrypted` text NOT NULL,
	`apiKeyIv` varchar(64) NOT NULL,
	`apiKeyTag` varchar(64) NOT NULL,
	`baseUrl` varchar(512),
	`models` json,
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`lastTestResult` boolean,
	`lastTestedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_provider_configs_id` PRIMARY KEY(`id`)
);
