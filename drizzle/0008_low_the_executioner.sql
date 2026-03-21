CREATE TABLE `chapter_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` int NOT NULL,
	`pageIndex` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`hasQuiz` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chapter_pages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`questionIndex` int NOT NULL,
	`questionType` enum('choice','truefalse') NOT NULL,
	`question` text NOT NULL,
	`options` json NOT NULL,
	`correctAnswer` varchar(16) NOT NULL,
	`explanation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`pageId` int NOT NULL,
	`chapterId` int NOT NULL,
	`courseId` int NOT NULL,
	`answer` varchar(16) NOT NULL,
	`isCorrect` boolean NOT NULL,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_answers_id` PRIMARY KEY(`id`)
);
