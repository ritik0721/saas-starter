import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  date,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  authProvider: varchar('auth_provider', { length: 20 }).notNull().default('password'),
  mobileNumber: varchar('mobile_number', { length: 20 }),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  leaveRequests: many(leaveRequests),
  leaveAllowances: many(leaveAllowances),
  approvedLeaveRequests: many(leaveRequests, { relationName: 'approvedBy' }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const leaveTypes = pgTable('leave_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#3B82F6'),
  isPaid: boolean('is_paid').notNull().default(true),
  requiresApproval: boolean('requires_approval').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const leaveAllowances = pgTable('leave_allowances', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  totalDays: integer('total_days').notNull(),
  usedDays: integer('used_days').notNull().default(0),
  carriedOver: integer('carried_over').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  leaveTypeId: integer('leave_type_id')
    .notNull()
    .references(() => leaveTypes.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  totalDays: decimal('total_days', { precision: 4, scale: 1 }).notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const leaveTypesRelations = relations(leaveTypes, ({ many }) => ({
  leaveRequests: many(leaveRequests),
}));

export const leaveAllowancesRelations = relations(leaveAllowances, ({ one }) => ({
  user: one(users, {
    fields: [leaveAllowances.userId],
    references: [users.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveRequests.leaveTypeId],
    references: [leaveTypes.id],
  }),
  approvedBy: one(users, {
    fields: [leaveRequests.approvedBy],
    references: [users.id],
  }),
}));

// Leave Policies
export const leavePolicies = pgTable('leave_policies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  leaveTypeId: integer('leave_type_id').references(() => leaveTypes.id, { onDelete: 'cascade' }),
  minNoticeDays: integer('min_notice_days').notNull().default(0),
  maxConsecutiveDays: integer('max_consecutive_days'),
  maxRequestsPerYear: integer('max_requests_per_year'),
  requiresApproval: boolean('requires_approval').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const leavePolicyRules = pgTable('leave_policy_rules', {
  id: serial('id').primaryKey(),
  policyId: integer('policy_id')
    .notNull()
    .references(() => leavePolicies.id, { onDelete: 'cascade' }),
  ruleType: varchar('rule_type', { length: 50 }).notNull(),
  ruleData: jsonb('rule_data').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const companySettings = pgTable('company_settings', {
  id: serial('id').primaryKey(),
  companyName: varchar('company_name', { length: 200 }).notNull().default('Your Company'),
  defaultAnnualLeaveDays: integer('default_annual_leave_days').notNull().default(25),
  allowCarryOver: boolean('allow_carry_over').notNull().default(true),
  maxCarryOverDays: integer('max_carry_over_days').notNull().default(5),
  fiscalYearStart: varchar('fiscal_year_start', { length: 5 }).notNull().default('01-01'),
  workingDays: integer('working_days').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const leavePoliciesRelations = relations(leavePolicies, ({ one, many }) => ({
  leaveType: one(leaveTypes, {
    fields: [leavePolicies.leaveTypeId],
    references: [leaveTypes.id],
  }),
  rules: many(leavePolicyRules),
}));

export const leavePolicyRulesRelations = relations(leavePolicyRules, ({ one }) => ({
  policy: one(leavePolicies, {
    fields: [leavePolicyRules.policyId],
    references: [leavePolicies.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type LeaveType = typeof leaveTypes.$inferSelect;
export type NewLeaveType = typeof leaveTypes.$inferInsert;
export type LeaveAllowance = typeof leaveAllowances.$inferSelect;
export type NewLeaveAllowance = typeof leaveAllowances.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
export type LeavePolicy = typeof leavePolicies.$inferSelect;
export type NewLeavePolicy = typeof leavePolicies.$inferInsert;
export type LeavePolicyRule = typeof leavePolicyRules.$inferSelect;
export type NewLeavePolicyRule = typeof leavePolicyRules.$inferInsert;
export type CompanySettings = typeof companySettings.$inferSelect;
export type NewCompanySettings = typeof companySettings.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
