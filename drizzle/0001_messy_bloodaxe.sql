CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text,
	`receiver_id` text NOT NULL,
	`content` text NOT NULL,
	`has_read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`receiver_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
