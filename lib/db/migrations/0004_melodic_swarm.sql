CREATE TABLE "company_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(200) DEFAULT 'Your Company' NOT NULL,
	"default_annual_leave_days" integer DEFAULT 25 NOT NULL,
	"allow_carry_over" boolean DEFAULT true NOT NULL,
	"max_carry_over_days" integer DEFAULT 5 NOT NULL,
	"fiscal_year_start" varchar(5) DEFAULT '01-01' NOT NULL,
	"working_days" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"leave_type_id" integer,
	"min_notice_days" integer DEFAULT 0 NOT NULL,
	"max_consecutive_days" integer,
	"max_requests_per_year" integer,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_policy_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_id" integer NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"rule_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_policy_rules" ADD CONSTRAINT "leave_policy_rules_policy_id_leave_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."leave_policies"("id") ON DELETE cascade ON UPDATE no action;