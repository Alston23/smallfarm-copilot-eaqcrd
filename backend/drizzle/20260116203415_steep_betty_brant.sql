ALTER TABLE "inventory" ADD COLUMN "subcategory" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "reorder_level" numeric(12, 2);