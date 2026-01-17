CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"equipment_type" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"hours" numeric(12, 2),
	"last_service_date" timestamp,
	"next_service_date" timestamp,
	"service_interval_hours" numeric(12, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
