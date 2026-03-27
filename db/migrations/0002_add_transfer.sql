ALTER TABLE `accounts` RENAME COLUMN `current_balance` TO `initial_balance`;--> statement-breakpoint
ALTER TABLE `transactions` ADD `transfer_pair_id` integer;
