CREATE TABLE "season_actuals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"crop_id" uuid NOT NULL,
	"actual_yield_amount" numeric(12, 2) NOT NULL,
	"actual_yield_unit" text NOT NULL,
	"actual_revenue" numeric(12, 2) NOT NULL,
	"actual_costs" numeric(12, 2) NOT NULL,
	"actual_profit" numeric(12, 2) NOT NULL,
	"variance_yield" numeric(5, 2),
	"variance_profit" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_yield_estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"crop_id" uuid NOT NULL,
	"estimated_yield_amount" numeric(12, 2) NOT NULL,
	"estimated_yield_unit" text NOT NULL,
	"estimated_market_price" numeric(12, 2) NOT NULL,
	"estimated_revenue" numeric(12, 2) NOT NULL,
	"estimated_costs" numeric(12, 2) DEFAULT '0',
	"estimated_profit" numeric(12, 2) NOT NULL,
	"market_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD COLUMN "season_id" uuid;--> statement-breakpoint
ALTER TABLE "harvests" ADD COLUMN "season_id" uuid;--> statement-breakpoint
ALTER TABLE "season_actuals" ADD CONSTRAINT "season_actuals_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_actuals" ADD CONSTRAINT "season_actuals_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_yield_estimates" ADD CONSTRAINT "season_yield_estimates_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_yield_estimates" ADD CONSTRAINT "season_yield_estimates_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;