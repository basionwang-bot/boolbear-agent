CREATE TABLE `classroom_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classroomId` int NOT NULL,
	`sceneId` int,
	`senderRole` enum('teacher','student','user') NOT NULL,
	`senderId` varchar(64) NOT NULL,
	`senderName` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classroom_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classroom_scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classroomId` int NOT NULL,
	`sceneIndex` int NOT NULL,
	`sceneType` enum('slide','quiz','discussion') NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`keyPoints` json,
	`estimatedDuration` int NOT NULL DEFAULT 120,
	`slideContent` json,
	`actions` json,
	`quizQuestions` json,
	`discussionConfig` json,
	`isGenerated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classroom_scenes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classrooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`requirement` text NOT NULL,
	`subject` varchar(64),
	`language` varchar(16) NOT NULL DEFAULT 'zh-CN',
	`status` enum('generating','ready','failed') NOT NULL DEFAULT 'generating',
	`sceneCount` int NOT NULL DEFAULT 0,
	`totalDuration` int NOT NULL DEFAULT 0,
	`teacherConfig` json,
	`studentAgents` json,
	`errorMessage` text,
	`materialId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classrooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_classroom_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classroomId` int NOT NULL,
	`currentSceneIndex` int NOT NULL DEFAULT 0,
	`quizScores` json,
	`timeSpentSeconds` int NOT NULL DEFAULT 0,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_classroom_progress_id` PRIMARY KEY(`id`)
);
