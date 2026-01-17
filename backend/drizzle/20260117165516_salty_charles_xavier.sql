CREATE TABLE "weather_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"location" text NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"forecast_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "weather_recommendation" text;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "weather_priority" text;