import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { generateObject } from 'ai';
import { gateway } from '@specific-dev/framework';
import { eq } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

interface CreateCustomCropBody {
  name: string;
  category: 'vegetables' | 'fruits' | 'herbs' | 'flowers';
}

const cropDetailSchema = z.object({
  rowSpacing: z.string().optional(),
  plantSpacing: z.string().optional(),
  soilPh: z.string().optional(),
  daysToMaturity: z.number().optional(),
  plantingDepth: z.string().optional(),
  sunRequirement: z.string().optional(),
  waterRequirement: z.string().optional(),
  commonPests: z.string().optional(),
  commonDiseases: z.string().optional(),
  fertilizerSchedule: z.string().optional(),
  harvestTips: z.string().optional(),
});

type CropDetail = z.infer<typeof cropDetailSchema>;

const PREDEFINED_CROPS: Record<string, Record<string, any>> = {
  vegetables: {
    tomato: {
      name: 'Tomato',
      category: 'vegetables',
      rowSpacing: '36-48',
      plantSpacing: '24-36',
      soilPh: '6.0-6.8',
      daysToMaturity: 70,
      plantingDepth: '1/4',
      sunRequirement: 'Full Sun (6-8 hours)',
      waterRequirement: 'Moderate to High',
      commonPests: 'Hornworms, Whiteflies, Aphids',
      commonDiseases: 'Early Blight, Late Blight, Septoria Leaf Spot',
      fertilizerSchedule: 'Every 2-3 weeks with balanced fertilizer',
      harvestTips: 'Pick when fully colored but still slightly soft',
    },
    lettuce: {
      name: 'Lettuce',
      category: 'vegetables',
      rowSpacing: '12-18',
      plantSpacing: '6-12',
      soilPh: '6.0-7.0',
      daysToMaturity: 45,
      plantingDepth: '1/4',
      sunRequirement: 'Partial Shade (4-6 hours)',
      waterRequirement: 'Moderate',
      commonPests: 'Slugs, Aphids, Leaf Miners',
      commonDiseases: 'Powdery Mildew, Downy Mildew',
      fertilizerSchedule: 'Every 3-4 weeks with nitrogen-rich fertilizer',
      harvestTips: 'Harvest outer leaves regularly or cut entire head',
    },
    carrot: {
      name: 'Carrot',
      category: 'vegetables',
      rowSpacing: '12-18',
      plantSpacing: '2-3',
      soilPh: '6.0-6.8',
      daysToMaturity: 70,
      plantingDepth: '1/4',
      sunRequirement: 'Full Sun (6-8 hours)',
      waterRequirement: 'Moderate',
      commonPests: 'Rust Flies, Carrot Weevils',
      commonDiseases: 'Cavity Spot, Cercospora Leaf Spot',
      fertilizerSchedule: 'Monthly with balanced fertilizer',
      harvestTips: 'Pull when shoulders are 1/2 inch diameter',
    },
  },
  fruits: {
    strawberry: {
      name: 'Strawberry',
      category: 'fruits',
      rowSpacing: '24-36',
      plantSpacing: '12-18',
      soilPh: '5.5-7.0',
      daysToMaturity: 60,
      plantingDepth: 'Crown level',
      sunRequirement: 'Full Sun (6-8 hours)',
      waterRequirement: 'Moderate',
      commonPests: 'Spider Mites, Slugs, Japanese Beetles',
      commonDiseases: 'Powdery Mildew, Leaf Spot',
      fertilizerSchedule: 'Every 3-4 weeks with balanced fertilizer',
      harvestTips: 'Pick berries fully red when they easily pull off',
    },
    blueberry: {
      name: 'Blueberry',
      category: 'fruits',
      rowSpacing: '48-60',
      plantSpacing: '36-48',
      soilPh: '4.5-5.5',
      daysToMaturity: 200,
      plantingDepth: '18-24 inches',
      sunRequirement: 'Full Sun (6-8 hours)',
      waterRequirement: 'High',
      commonPests: 'Fruit Fly, Birds, Japanese Beetles',
      commonDiseases: 'Mummy Berry, Stem Blight',
      fertilizerSchedule: 'Every 4-6 weeks with acid fertilizer',
      harvestTips: 'Harvest when berries turn deep blue',
    },
  },
  herbs: {
    basil: {
      name: 'Basil',
      category: 'herbs',
      rowSpacing: '12-18',
      plantSpacing: '6-12',
      soilPh: '6.0-7.0',
      daysToMaturity: 50,
      plantingDepth: '1/4',
      sunRequirement: 'Full Sun (6-8 hours)',
      waterRequirement: 'Moderate',
      commonPests: 'Japanese Beetles, Slugs',
      commonDiseases: 'Downy Mildew, Fusarium Wilt',
      fertilizerSchedule: 'Every 4 weeks with balanced fertilizer',
      harvestTips: 'Pinch off flower buds to encourage growth',
    },
    cilantro: {
      name: 'Cilantro',
      category: 'herbs',
      rowSpacing: '6-12',
      plantSpacing: '3-6',
      soilPh: '6.0-7.0',
      daysToMaturity: 45,
      plantingDepth: '1/4',
      sunRequirement: 'Partial Shade (4-6 hours)',
      waterRequirement: 'Moderate',
      commonPests: 'Aphids, Spider Mites',
      commonDiseases: 'Powdery Mildew',
      fertilizerSchedule: 'Every 3-4 weeks with balanced fertilizer',
      harvestTips: 'Harvest leaves regularly before flowering',
    },
  },
  flowers: {
    sunflower: {
      name: 'Sunflower',
      category: 'flowers',
      rowSpacing: '24-36',
      plantSpacing: '12-24',
      soilPh: '6.0-7.5',
      daysToMaturity: 85,
      plantingDepth: '1',
      sunRequirement: 'Full Sun (6-8 hours)',
      waterRequirement: 'Moderate',
      commonPests: 'Striped Cucumber Beetle, Sunflower Maggot',
      commonDiseases: 'Powdery Mildew, Rust',
      fertilizerSchedule: 'Every 4-6 weeks with balanced fertilizer',
      harvestTips: 'Cut flowers in early morning when stems are firm',
    },
    rose: {
      name: 'Rose',
      category: 'flowers',
      rowSpacing: '24-36',
      plantSpacing: '18-24',
      soilPh: '6.0-6.5',
      daysToMaturity: 365,
      plantingDepth: '18-24 inches',
      sunRequirement: 'Full Sun (6-8 hours)',
      waterRequirement: 'Moderate to High',
      commonPests: 'Aphids, Japanese Beetles, Spider Mites',
      commonDiseases: 'Black Spot, Powdery Mildew, Rose Rosette',
      fertilizerSchedule: 'Every 4-6 weeks with rose fertilizer',
      harvestTips: 'Cut in early morning when flowers are cool',
    },
  },
};

export function registerCropRoutes(app: App): void {
  // GET /api/crops - Get all crops (both predefined and user custom)
  app.fastify.get<{}>(
    '/api/crops',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching all crops');

      try {
        // Get all predefined crops
        const allPredefinedCrops: any[] = [];
        for (const category in PREDEFINED_CROPS) {
          for (const cropKey in PREDEFINED_CROPS[category]) {
            allPredefinedCrops.push(PREDEFINED_CROPS[category][cropKey]);
          }
        }

        // Get custom crops for user if authenticated
        let userCustomCrops = [];
        const session = await app.requireAuth()(request, reply);
        if (session) {
          userCustomCrops = await app.db.query.crops.findMany({
            where: eq(schema.crops.userId, session.user.id),
          });
        }

        const allCrops = [
          ...allPredefinedCrops,
          ...userCustomCrops,
        ];

        app.logger.info(
          { totalCrops: allCrops.length, customCrops: userCustomCrops.length },
          'Crops fetched successfully'
        );

        return allCrops;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch crops');
        throw error;
      }
    }
  );

  // POST /api/crops/custom - Create a custom crop with AI-generated details
  app.fastify.post<{ Body: CreateCustomCropBody }>(
    '/api/crops/custom',
    async (request: FastifyRequest<{ Body: CreateCustomCropBody }>, reply: FastifyReply) => {
      const { name, category } = request.body;

      app.logger.info({ name, category }, 'Creating custom crop');

      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Generate crop details using AI
        const { object: generatedDetails } = await generateObject({
          model: gateway('openai/gpt-5-mini'),
          schema: cropDetailSchema,
          schemaName: 'CropDetails',
          schemaDescription:
            'Generate detailed farming information for a crop including spacing, soil requirements, maturity time, and care instructions.',
          prompt: `Generate detailed farming information for a ${category} crop named "${name}". Provide all fields with practical advice. For numeric fields, provide ranges in the format "min-max" (e.g., "24-36"). For daysToMaturity, provide just a number.`,
        });

        // Create crop in database
        const [crop] = await app.db
          .insert(schema.crops)
          .values({
            name,
            category: category as any,
            userId: session.user.id,
            isCustom: true,
            rowSpacing: generatedDetails.rowSpacing,
            plantSpacing: generatedDetails.plantSpacing,
            soilPh: generatedDetails.soilPh,
            daysToMaturity: generatedDetails.daysToMaturity,
            plantingDepth: generatedDetails.plantingDepth,
            sunRequirement: generatedDetails.sunRequirement,
            waterRequirement: generatedDetails.waterRequirement,
            commonPests: generatedDetails.commonPests,
            commonDiseases: generatedDetails.commonDiseases,
            fertilizerSchedule: generatedDetails.fertilizerSchedule,
            harvestTips: generatedDetails.harvestTips,
          })
          .returning();

        app.logger.info({ cropId: crop.id, name }, 'Custom crop created successfully');

        return crop;
      } catch (error) {
        app.logger.error({ err: error, name, category }, 'Failed to create custom crop');
        throw error;
      }
    }
  );
}
