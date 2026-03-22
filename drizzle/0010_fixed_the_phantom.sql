ALTER TABLE `exam_analyses` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `exam_analyses` ADD CONSTRAINT `exam_analyses_shareToken_unique` UNIQUE(`shareToken`);