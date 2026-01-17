CREATE TABLE "field_bed_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"field_bed_id" uuid NOT NULL,
	"note_type" text NOT NULL,
	"file_url" text NOT NULL,
	"caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "cold_storage_capacity" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "cold_storage_used" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "dry_storage_capacity" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "dry_storage_used" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "low_stock_alert_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "last_alert_date" timestamp;--> statement-breakpoint
ALTER TABLE "field_bed_notes" ADD CONSTRAINT "field_bed_notes_field_bed_id_fields_beds_id_fk" FOREIGN KEY ("field_bed_id") REFERENCES "public"."fields_beds"("id") ON DELETE cascade ON UPDATE no action;