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
  rowSpacing: text('row_spacing'),
  plantSpacing: text('plant_spacing'),
  soilPh: text('soil_ph'),
  daysToMaturity: integer('days_to_maturity'),
  plantingDepth: text('planting_depth'),
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
  weatherRecommendation: text('weather_recommendation'),
  weatherPriority: text('weather_priority', { enum: ['low', 'medium', 'high'] }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===== Weather =====
export const weatherAlerts = pgTable('weather_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  location: text('location').notNull(),
  alertType: text('alert_type').notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high'] }).notNull(),
  description: text('description').notNull(),
  forecastDate: timestamp('forecast_date').notNull(),
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
      'transplants',
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
  coldStorageCapacity: numeric('cold_storage_capacity', { precision: 12, scale: 2 }),
  coldStorageUsed: numeric('cold_storage_used', { precision: 12, scale: 2 }),
  dryStorageCapacity: numeric('dry_storage_capacity', { precision: 12, scale: 2 }),
  dryStorageUsed: numeric('dry_storage_used', { precision: 12, scale: 2 }),
  lowStockAlertSent: boolean('low_stock_alert_sent').default(false),
  lastAlertDate: timestamp('last_alert_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// ===== Seasons Management =====
export const seasons = pgTable('seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const seasonYieldEstimates = pgTable('season_yield_estimates', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  cropId: uuid('crop_id').notNull().references(() => crops.id, { onDelete: 'cascade' }),
  estimatedYieldAmount: numeric('estimated_yield_amount', { precision: 12, scale: 2 }).notNull(),
  estimatedYieldUnit: text('estimated_yield_unit').notNull(),
  estimatedMarketPrice: numeric('estimated_market_price', { precision: 12, scale: 2 }).notNull(),
  estimatedRevenue: numeric('estimated_revenue', { precision: 12, scale: 2 }).notNull(),
  estimatedCosts: numeric('estimated_costs', { precision: 12, scale: 2 }).default('0'),
  estimatedProfit: numeric('estimated_profit', { precision: 12, scale: 2 }).notNull(),
  marketData: jsonb('market_data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const seasonActuals = pgTable('season_actuals', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  cropId: uuid('crop_id').notNull().references(() => crops.id, { onDelete: 'cascade' }),
  actualYieldAmount: numeric('actual_yield_amount', { precision: 12, scale: 2 }).notNull(),
  actualYieldUnit: text('actual_yield_unit').notNull(),
  actualRevenue: numeric('actual_revenue', { precision: 12, scale: 2 }).notNull(),
  actualCosts: numeric('actual_costs', { precision: 12, scale: 2 }).notNull(),
  actualProfit: numeric('actual_profit', { precision: 12, scale: 2 }).notNull(),
  varianceYield: numeric('variance_yield', { precision: 5, scale: 2 }),
  varianceProfit: numeric('variance_profit', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// ===== Field/Bed Notes =====
export const fieldBedNotes = pgTable('field_bed_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  fieldBedId: uuid('field_bed_id').notNull().references(() => fieldsBeds.id, { onDelete: 'cascade' }),
  noteType: text('note_type', { enum: ['photo', 'voice'] }).notNull(),
  fileUrl: text('file_url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===== Financial Tracking =====
export const financialTransactions = pgTable('financial_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  fieldBedCropId: uuid('field_bed_crop_id').references(() => fieldBedCrops.id, { onDelete: 'set null' }),
  seasonId: uuid('season_id').references(() => seasons.id, { onDelete: 'set null' }),
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

// ===== Harvest Tracking =====
export const harvests = pgTable('harvests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  fieldBedCropId: uuid('field_bed_crop_id').notNull().references(() => fieldBedCrops.id, { onDelete: 'cascade' }),
  cropId: uuid('crop_id').notNull().references(() => crops.id, { onDelete: 'cascade' }),
  seasonId: uuid('season_id').references(() => seasons.id, { onDelete: 'set null' }),
  harvestAmount: numeric('harvest_amount', { precision: 12, scale: 2 }).notNull(),
  harvestUnit: text('harvest_unit').notNull(),
  yieldPercentage: numeric('yield_percentage', { precision: 5, scale: 2 }),
  harvestDate: timestamp('harvest_date').notNull(),
  notes: text('notes'),
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

// ===== Equipment Inventory =====
export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  equipmentType: text('equipment_type').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  hours: numeric('hours', { precision: 12, scale: 2 }),
  lastServiceDate: timestamp('last_service_date'),
  nextServiceDate: timestamp('next_service_date'),
  serviceIntervalHours: numeric('service_interval_hours', { precision: 12, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
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
  notes: many(fieldBedNotes),
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
  harvests: many(harvests),
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

export const harvestsRelations = relations(harvests, ({ one }) => ({
  fieldBedCrop: one(fieldBedCrops, {
    fields: [harvests.fieldBedCropId],
    references: [fieldBedCrops.id],
  }),
  crop: one(crops, {
    fields: [harvests.cropId],
    references: [crops.id],
  }),
}));

export const weatherAlertsRelations = relations(weatherAlerts, ({}) => ({}));

export const equipmentRelations = relations(equipment, ({}) => ({}));

export const fieldBedNotesRelations = relations(fieldBedNotes, ({ one }) => ({
  fieldBed: one(fieldsBeds, {
    fields: [fieldBedNotes.fieldBedId],
    references: [fieldsBeds.id],
  }),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  yieldEstimates: many(seasonYieldEstimates),
  actuals: many(seasonActuals),
}));

export const seasonYieldEstimatesRelations = relations(seasonYieldEstimates, ({ one }) => ({
  season: one(seasons, {
    fields: [seasonYieldEstimates.seasonId],
    references: [seasons.id],
  }),
  crop: one(crops, {
    fields: [seasonYieldEstimates.cropId],
    references: [crops.id],
  }),
}));

export const seasonActualsRelations = relations(seasonActuals, ({ one }) => ({
  season: one(seasons, {
    fields: [seasonActuals.seasonId],
    references: [seasons.id],
  }),
  crop: one(crops, {
    fields: [seasonActuals.cropId],
    references: [crops.id],
  }),
}));
