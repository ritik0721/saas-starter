-- Create leave policies table
CREATE TABLE IF NOT EXISTS "leave_policies" (
  "id" serial PRIMARY KEY,
  "name" varchar(100) NOT NULL,
  "description" text,
  "leave_type_id" integer REFERENCES "leave_types"("id") ON DELETE CASCADE,
  "min_notice_days" integer NOT NULL DEFAULT 0,
  "max_consecutive_days" integer,
  "max_requests_per_year" integer,
  "requires_approval" boolean NOT NULL DEFAULT true,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create leave policy rules table for more complex rules
CREATE TABLE IF NOT EXISTS "leave_policy_rules" (
  "id" serial PRIMARY KEY,
  "policy_id" integer NOT NULL REFERENCES "leave_policies"("id") ON DELETE CASCADE,
  "rule_type" varchar(50) NOT NULL, -- 'blackout_dates', 'seasonal_limits', 'team_coverage'
  "rule_data" jsonb NOT NULL, -- Flexible rule configuration
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create company settings table
CREATE TABLE IF NOT EXISTS "company_settings" (
  "id" serial PRIMARY KEY,
  "company_name" varchar(200) NOT NULL DEFAULT 'Your Company',
  "default_annual_leave_days" integer NOT NULL DEFAULT 25,
  "allow_carry_over" boolean NOT NULL DEFAULT true,
  "max_carry_over_days" integer NOT NULL DEFAULT 5,
  "fiscal_year_start" varchar(5) NOT NULL DEFAULT '01-01', -- MM-DD format
  "working_days" integer[] NOT NULL DEFAULT '{1,2,3,4,5}', -- Monday=1, Sunday=7
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Insert default company settings
INSERT INTO "company_settings" ("company_name", "default_annual_leave_days", "allow_carry_over", "max_carry_over_days", "fiscal_year_start", "working_days") VALUES
  ('Your Company', 25, true, 5, '01-01', '{1,2,3,4,5}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_leave_policies_leave_type" ON "leave_policies"("leave_type_id");
CREATE INDEX IF NOT EXISTS "idx_leave_policies_active" ON "leave_policies"("is_active");
CREATE INDEX IF NOT EXISTS "idx_leave_policy_rules_policy" ON "leave_policy_rules"("policy_id");
CREATE INDEX IF NOT EXISTS "idx_leave_policy_rules_type" ON "leave_policy_rules"("rule_type");
