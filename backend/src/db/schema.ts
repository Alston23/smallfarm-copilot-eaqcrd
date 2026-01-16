import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===== Chat Feature =====
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===== Crop Management =====
export const crops = pgTable('crops', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category', {
    enum: ['vegetables', 'fruits', 'herbs', 'flowers'],
  }).notNull(),
  rowSpacing: numeric('row_spacing', { precision: 10, scale: 2 }),
  plantSpacing: numeric('plant_spacing', { precision: 10, scale: 2 }),
  soilPh: text('soil_ph'),
  daysToMaturity: integer('days_to_maturity'),
  plantingDepth: numeric('planting_depth', { precision: 10, scale: 2 }),
  sunRequirement: text('sun_requirement'),
  waterRequirement: text('water_requirement'),
  commonPests: text('common_pests'),
  commonDiseases: text('common_diseases'),
  fertilizerSchedule: text('fertilizer_schedule'),
  harvestTips: text('harvest_tips'),
  isCustom: boolean('is_custom').default(false),
  userId: text('user_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===== Fields & Beds =====
export const fieldsBeds = pgTable('fields_beds', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['field', 'bed'] }).notNull(),
  squareFootage: numeric('square_footage', { precision: 12, scale: 2 }),
  acreage: numeric('acreage', { precision: 12, scale: 4 }),
  irrigationType: text('irrigation_type', {
    enum: ['drip', 'sprinkler', 'flood', 'manual', 'none'],
  }),
  soilType: text('soil_type', {
    enum: ['clay', 'sandy', 'loam', 'silt', 'peat', 'chalk'],
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const fieldBedCrops = pgTable('field_bed_crops', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldBedId: uuid('field_bed_id').notNull().references(() => fieldsBeds.id, { onDelete: 'cascade' }),
  cropId: uuid('crop_id').notNull().references(() => crops.id, { onDelete: 'cascade' }),
  plantingDate: timestamp('planting_date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===== Scheduling =====
export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  fieldBedCropId: uuid('field_bed_crop_id').notNull().references(() => fieldBedCrops.id, { onDelete: 'cascade' }),
  taskType: text('task_type', { enum: ['fertilize', 'water', 'harvest', 'prune', 'pest_control', 'weed', 'other'] }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  completed: boolean('completed').default(false),
  completedDate: timestamp('completed_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===== Inventory =====
export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category', {
    enum: [
      'fertilizer',
      'seeds',
      'value_added_materials',
      'pesticides',
      'tools',
      'packaging',
      'irrigation_supplies',
      'soil_amendments',
      'other',
    ],
  }).notNull(),
  subcategory: text('subcategory'),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  notes: text('notes'),
  reorderLevel: numeric('reorder_level', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// ===== Financial Tracking =====
export const financialTransactions = pgTable('financial_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  fieldBedCropId: uuid('field_bed_crop_id').references(() => fieldBedCrops.id, { onDelete: 'set null' }),
  type: text('type', { enum: ['cost', 'revenue'] }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  transactionDate: timestamp('transaction_date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const financialPredictions = pgTable('financial_predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldBedCropId: uuid('field_bed_crop_id').notNull().references(() => fieldBedCrops.id, { onDelete: 'cascade' }),
  predictedYield: numeric('predicted_yield', { precision: 12, scale: 2 }),
  predictedProfit: numeric('predicted_profit', { precision: 12, scale: 2 }),
  marketData: jsonb('market_data'),
  isActual: boolean('is_actual').default(false),
  actualYield: numeric('actual_yield', { precision: 12, scale: 2 }),
  actualProfit: numeric('actual_profit', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// ===== Consumer Marketplace =====
export const consumerListings = pgTable('consumer_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  cropId: uuid('crop_id').notNull().references(() => crops.id, { onDelete: 'cascade' }),
  outlet: text('outlet', {
    enum: ['restaurant', 'farmers_market', 'roadside_stand', 'csa', 'other'],
  }).notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  imageKey: text('image_key'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const consumerCustomers = pgTable('consumer_customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  outlet: text('outlet').notNull(),
  contactInfo: text('contact_info'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const consumerOrders = pgTable('consumer_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  customerId: uuid('customer_id').notNull().references(() => consumerCustomers.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => consumerListings.id, { onDelete: 'cascade' }),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
  purchaseDate: timestamp('purchase_date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===== Equipment Marketplace =====
export const equipmentListings = pgTable('equipment_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type', { enum: ['buy', 'sell', 'trade'] }).notNull(),
  price: numeric('price', { precision: 12, scale: 2 }),
  imageKey: text('image_key'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const equipmentInquiries = pgTable('equipment_inquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => equipmentListings.id, { onDelete: 'cascade' }),
  inquirerUserId: text('inquirer_user_id').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===== Relations =====
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const fieldBedsRelations = relations(fieldsBeds, ({ many }) => ({
  crops: many(fieldBedCrops),
}));

export const fieldBedCropsRelations = relations(fieldBedCrops, ({ one, many }) => ({
  fieldBed: one(fieldsBeds, {
    fields: [fieldBedCrops.fieldBedId],
    references: [fieldsBeds.id],
  }),
  crop: one(crops, {
    fields: [fieldBedCrops.cropId],
    references: [crops.id],
  }),
  schedules: many(schedules),
  financialData: many(financialTransactions),
  predictions: many(financialPredictions),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  fieldBedCrop: one(fieldBedCrops, {
    fields: [schedules.fieldBedCropId],
    references: [fieldBedCrops.id],
  }),
}));

export const consumerListingsRelations = relations(consumerListings, ({ one, many }) => ({
  crop: one(crops, {
    fields: [consumerListings.cropId],
    references: [crops.id],
  }),
  orders: many(consumerOrders),
}));

export const consumerCustomersRelations = relations(consumerCustomers, ({ many }) => ({
  orders: many(consumerOrders),
}));

export const consumerOrdersRelations = relations(consumerOrders, ({ one }) => ({
  customer: one(consumerCustomers, {
    fields: [consumerOrders.customerId],
    references: [consumerCustomers.id],
  }),
  listing: one(consumerListings, {
    fields: [consumerOrders.listingId],
    references: [consumerListings.id],
  }),
}));

export const equipmentListingsRelations = relations(equipmentListings, ({ many }) => ({
  inquiries: many(equipmentInquiries),
}));

export const equipmentInquiriesRelations = relations(equipmentInquiries, ({ one }) => ({
  listing: one(equipmentListings, {
    fields: [equipmentInquiries.listingId],
    references: [equipmentListings.id],
  }),
}));
