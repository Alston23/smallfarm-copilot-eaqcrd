import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';
import { registerChatRoutes } from './routes/chat.js';
import { registerCropRoutes, seedSystemCrops } from './routes/crops.js';
import { registerFieldsBedsRoutes } from './routes/fields-beds.js';
import { registerScheduleRoutes } from './routes/schedules.js';
import { registerInventoryRoutes } from './routes/inventory.js';
import { registerFinancialRoutes } from './routes/financial.js';
import { registerHarvestRoutes } from './routes/harvest.js';
import { registerConsumerMarketplaceRoutes } from './routes/marketplace-consumer.js';
import { registerEquipmentMarketplaceRoutes } from './routes/marketplace-equipment.js';
import { registerUploadRoutes } from './routes/upload.js';
import { registerAiRoutes } from './routes/ai.js';
import { registerWeatherRoutes } from './routes/weather.js';
import { registerEquipmentRoutes } from './routes/equipment.js';
import { registerFieldBedNotesRoutes } from './routes/field-bed-notes.js';
import { registerInventoryStorageRoutes } from './routes/inventory-storage.js';
import { registerReportRoutes } from './routes/reports.js';
import { registerSeasonRoutes } from './routes/seasons.js';

const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication and storage
app.withAuth();
app.withStorage();

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerChatRoutes(app);
registerCropRoutes(app);
registerFieldsBedsRoutes(app);
registerScheduleRoutes(app);
registerInventoryRoutes(app);
registerFinancialRoutes(app);
registerHarvestRoutes(app);
registerConsumerMarketplaceRoutes(app);
registerEquipmentMarketplaceRoutes(app);
registerUploadRoutes(app);
registerAiRoutes(app);
registerWeatherRoutes(app);
registerEquipmentRoutes(app);
registerFieldBedNotesRoutes(app);
registerInventoryStorageRoutes(app);
registerReportRoutes(app);
registerSeasonRoutes(app);

// Seed system crops on startup
await seedSystemCrops(app);

await app.run();
app.logger.info('SmallFarm Copilot backend running');
