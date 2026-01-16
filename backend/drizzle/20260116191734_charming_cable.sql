CREATE TABLE "consumer_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"outlet" text NOT NULL,
	"contact_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumer_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"crop_id" uuid NOT NULL,
	"outlet" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"unit" text NOT NULL,
	"image_key" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumer_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"purchase_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"row_spacing" numeric(10, 2),
	"plant_spacing" numeric(10, 2),
	"soil_ph" text,
	"days_to_maturity" integer,
	"planting_depth" numeric(10, 2),
	"sun_requirement" text,
	"water_requirement" text,
	"common_pests" text,
	"common_diseases" text,
	"fertilizer_schedule" text,
	"harvest_tips" text,
	"is_custom" boolean DEFAULT false,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"inquirer_user_id" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"price" numeric(12, 2),
	"image_key" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_bed_crops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_bed_id" uuid NOT NULL,
	"crop_id" uuid NOT NULL,
	"planting_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fields_beds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"square_footage" numeric(12, 2),
	"acreage" numeric(12, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_bed_crop_id" uuid NOT NULL,
	"predicted_yield" numeric(12, 2),
	"predicted_profit" numeric(12, 2),
	"market_data" jsonb,
	"is_actual" boolean DEFAULT false,
	"actual_yield" numeric(12, 2),
	"actual_profit" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"field_bed_crop_id" uuid,
	"type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"field_bed_crop_id" uuid NOT NULL,
	"task_type" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"completed" boolean DEFAULT false,
	"completed_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "consumer_listings" ADD CONSTRAINT "consumer_listings_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_orders" ADD CONSTRAINT "consumer_orders_customer_id_consumer_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."consumer_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_orders" ADD CONSTRAINT "consumer_orders_listing_id_consumer_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."consumer_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inquiries" ADD CONSTRAINT "equipment_inquiries_listing_id_equipment_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."equipment_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_bed_crops" ADD CONSTRAINT "field_bed_crops_field_bed_id_fields_beds_id_fk" FOREIGN KEY ("field_bed_id") REFERENCES "public"."fields_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_bed_crops" ADD CONSTRAINT "field_bed_crops_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_predictions" ADD CONSTRAINT "financial_predictions_field_bed_crop_id_field_bed_crops_id_fk" FOREIGN KEY ("field_bed_crop_id") REFERENCES "public"."field_bed_crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_field_bed_crop_id_field_bed_crops_id_fk" FOREIGN KEY ("field_bed_crop_id") REFERENCES "public"."field_bed_crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_field_bed_crop_id_field_bed_crops_id_fk" FOREIGN KEY ("field_bed_crop_id") REFERENCES "public"."field_bed_crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;