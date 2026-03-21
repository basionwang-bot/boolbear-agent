CREATE TABLE `course_chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`chapterIndex` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`objectives` json,
	`keyPoints` json,
	`content` text,
	`estimatedMinutes` int NOT NULL DEFAULT 30,
	`isGenerated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_chapters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`subject` varchar(64) NOT NULL,
	`chapterCount` int NOT NULL DEFAULT 0,
	`totalMinutes` int NOT NULL DEFAULT 0,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generated_courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`subject` varchar(64) NOT NULL,
	`gradeLevel` varchar(64),
	`createdBy` int NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_course_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`lastCompletedChapter` int NOT NULL DEFAULT 0,
	`timeSpentMinutes` int NOT NULL DEFAULT 0,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_course_progress_id` PRIMARY KEY(`id`)
);
