CREATE TABLE "harvests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"field_bed_crop_id" uuid NOT NULL,
	"crop_id" uuid NOT NULL,
	"harvest_amount" numeric(12, 2) NOT NULL,
	"harvest_unit" text NOT NULL,
	"yield_percentage" numeric(5, 2),
	"harvest_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_field_bed_crop_id_field_bed_crops_id_fk" FOREIGN KEY ("field_bed_crop_id") REFERENCES "public"."field_bed_crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE cascade ON UPDATE no action;