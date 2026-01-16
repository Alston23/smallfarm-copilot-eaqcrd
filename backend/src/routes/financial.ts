import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { generateObject } from 'ai';
import { gateway } from '@specific-dev/framework';
import { eq } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

interface CreateTransactionBody {
  fieldBedCropId?: string;
  type: 'cost' | 'revenue';
  amount: string;
  description: string;
  transactionDate: string;
}

interface PredictFinancialBody {
  fieldBedCropId: string;
}

interface UpdatePredictionBody {
  actualYield?: string;
  actualProfit?: string;
}

const predictionSchema = z.object({
  predictedYield: z.number().optional(),
  predictedProfit: z.number().optional(),
  marketData: z.object({
    marketPrice: z.string().optional(),
    demandLevel: z.string().optional(),
    seasonalFactors: z.string().optional(),
  }).optional(),
});

type Prediction = z.infer<typeof predictionSchema>;

export function registerFinancialRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/financial - Get financial data for user
  app.fastify.get<{}>(
    '/api/financial',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching financial data');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const transactions = await app.db.query.financialTransactions.findMany({
          where: eq(schema.financialTransactions.userId, session.user.id),
        });

        const predictions = await app.db.query.financialPredictions.findMany({});

        // Calculate summary
        const totalRevenue = transactions
          .filter((t) => t.type === 'revenue')
          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        const totalCosts = transactions
          .filter((t) => t.type === 'cost')
          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        const netProfit = totalRevenue - totalCosts;

        app.logger.info(
          { transactionCount: transactions.length, totalRevenue, totalCosts },
          'Financial data fetched successfully'
        );

        return {
          transactions,
          predictions,
          summary: {
            totalRevenue,
            totalCosts,
            netProfit,
          },
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch financial data');
        throw error;
      }
    }
  );

  // POST /api/financial - Create financial transaction
  app.fastify.post<{ Body: CreateTransactionBody }>(
    '/api/financial',
    async (request: FastifyRequest<{ Body: CreateTransactionBody }>, reply: FastifyReply) => {
      const { fieldBedCropId, type, amount, description, transactionDate } = request.body;

      app.logger.info({ type, amount }, 'Creating financial transaction');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const [transaction] = await app.db
          .insert(schema.financialTransactions)
          .values({
            userId: session.user.id,
            fieldBedCropId: fieldBedCropId || undefined,
            type: type as any,
            amount: parseFloat(amount).toString(),
            description,
            transactionDate: new Date(transactionDate),
          })
          .returning();

        app.logger.info(
          { transactionId: transaction.id, type, amount },
          'Financial transaction created successfully'
        );

        return transaction;
      } catch (error) {
        app.logger.error({ err: error, type, amount }, 'Failed to create financial transaction');
        throw error;
      }
    }
  );

  // POST /api/financial/predict - Generate financial prediction
  app.fastify.post<{ Body: PredictFinancialBody }>(
    '/api/financial/predict',
    async (request: FastifyRequest<{ Body: PredictFinancialBody }>, reply: FastifyReply) => {
      const { fieldBedCropId } = request.body;

      app.logger.info({ fieldBedCropId }, 'Generating financial prediction');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Fetch field bed crop with related data
        const fieldBedCrop = await app.db.query.fieldBedCrops.findFirst({
          where: eq(schema.fieldBedCrops.id, fieldBedCropId),
          with: {
            crop: true,
            fieldBed: true,
            financialData: true,
          },
        });

        if (!fieldBedCrop) {
          return reply.status(404).send({ error: 'Field bed crop not found' });
        }

        // Calculate costs
        const existingCosts = fieldBedCrop.financialData
          .filter((t) => t.type === 'cost')
          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        // Generate prediction using AI
        const { object: prediction } = await generateObject({
          model: gateway('openai/gpt-5-mini'),
          schema: predictionSchema,
          schemaName: 'FinancialPrediction',
          schemaDescription: 'Generate financial predictions for a crop including yield, profit, and market data',
          prompt: `Generate financial predictions for a ${fieldBedCrop.crop.name} crop with current costs of $${existingCosts}.
            Analyze market conditions and provide predicted yield (in units of the crop), predicted profit, market price range, demand level, and seasonal factors.
            Base predictions on typical yields and market prices for ${fieldBedCrop.crop.name}.`,
        });

        // Create or update prediction
        let existingPrediction = await app.db.query.financialPredictions.findFirst({
          where: eq(schema.financialPredictions.fieldBedCropId, fieldBedCropId),
        });

        if (existingPrediction) {
          const [updated] = await app.db
            .update(schema.financialPredictions)
            .set({
              predictedYield: prediction.predictedYield?.toString(),
              predictedProfit: prediction.predictedProfit?.toString(),
              marketData: prediction.marketData,
            })
            .where(eq(schema.financialPredictions.fieldBedCropId, fieldBedCropId))
            .returning();

          app.logger.info(
            { fieldBedCropId, predictedProfit: prediction.predictedProfit },
            'Financial prediction updated successfully'
          );

          return updated;
        } else {
          const [created] = await app.db
            .insert(schema.financialPredictions)
            .values({
              fieldBedCropId,
              predictedYield: prediction.predictedYield?.toString(),
              predictedProfit: prediction.predictedProfit?.toString(),
              marketData: prediction.marketData,
            })
            .returning();

          app.logger.info(
            { fieldBedCropId, predictedProfit: prediction.predictedProfit },
            'Financial prediction created successfully'
          );

          return created;
        }
      } catch (error) {
        app.logger.error({ err: error, fieldBedCropId }, 'Failed to generate financial prediction');
        throw error;
      }
    }
  );

  // PATCH /api/financial/predict/:id - Update prediction with actual data
  app.fastify.patch<{ Params: { id: string }; Body: UpdatePredictionBody }>(
    '/api/financial/predict/:id',
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdatePredictionBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { actualYield, actualProfit } = request.body;

      app.logger.info({ predictionId: id }, 'Updating prediction with actual data');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const updateData: any = {
          isActual: true,
        };
        if (actualYield !== undefined) {
          updateData.actualYield = parseFloat(actualYield);
        }
        if (actualProfit !== undefined) {
          updateData.actualProfit = parseFloat(actualProfit);
        }

        const [updated] = await app.db
          .update(schema.financialPredictions)
          .set(updateData)
          .where(eq(schema.financialPredictions.id, id))
          .returning();

        app.logger.info({ predictionId: id }, 'Prediction updated with actual data successfully');

        return updated;
      } catch (error) {
        app.logger.error({ err: error, predictionId: id }, 'Failed to update prediction');
        throw error;
      }
    }
  );

  // GET /api/financial/report/by-crop - Get financial report integrated with harvest data
  app.fastify.get<{}>(
    '/api/financial/report/by-crop',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching financial report by crop');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Fetch all field bed crops with relations
        const fieldBedCrops = await app.db.query.fieldBedCrops.findMany({
          with: {
            crop: true,
            fieldBed: true,
            harvests: true,
            financialData: true,
            predictions: true,
          },
        });

        // Build report by crop
        const reportByCrop = new Map<string, any>();

        for (const fbc of fieldBedCrops) {
          const cropId = fbc.cropId;
          const cropName = fbc.crop.name;

          if (!reportByCrop.has(cropId)) {
            reportByCrop.set(cropId, {
              cropId,
              cropName,
              totalCosts: 0,
              totalRevenue: 0,
              totalHarvestAmount: 0,
              harvestUnit: '',
              averageYield: 0,
              harvestCount: 0,
              netProfit: 0,
              plantings: [],
            });
          }

          const report = reportByCrop.get(cropId)!;

          // Calculate costs for this crop
          const cropCosts = fbc.financialData
            .filter((t) => t.type === 'cost')
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

          // Calculate revenue for this crop
          const cropRevenue = fbc.financialData
            .filter((t) => t.type === 'revenue')
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

          report.totalCosts += cropCosts;
          report.totalRevenue += cropRevenue;
          report.harvestCount += fbc.harvests.length;

          // Add harvest data
          if (fbc.harvests.length > 0) {
            report.totalHarvestAmount += fbc.harvests.reduce(
              (sum, h) => sum + parseFloat(h.harvestAmount.toString()),
              0
            );
            report.harvestUnit = fbc.harvests[0].harvestUnit;

            // Calculate average yield
            const yieldPercentages = fbc.harvests
              .filter((h) => h.yieldPercentage !== null)
              .map((h) => parseFloat(h.yieldPercentage!.toString()));

            if (yieldPercentages.length > 0) {
              report.averageYield =
                yieldPercentages.reduce((sum, val) => sum + val, 0) / yieldPercentages.length;
            }
          }

          report.netProfit = report.totalRevenue - report.totalCosts;

          // Add planting detail
          report.plantings.push({
            fieldBedCropId: fbc.id,
            fieldBedName: fbc.fieldBed.name,
            plantingDate: fbc.plantingDate,
            harvestCount: fbc.harvests.length,
            totalHarvest: fbc.harvests.reduce(
              (sum, h) => sum + parseFloat(h.harvestAmount.toString()),
              0
            ),
            costs: cropCosts,
            revenue: cropRevenue,
            profit: cropRevenue - cropCosts,
          });
        }

        const reportArray = Array.from(reportByCrop.values());

        app.logger.info(
          { cropsInReport: reportArray.length },
          'Financial report by crop fetched successfully'
        );

        return reportArray;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch financial report by crop');
        throw error;
      }
    }
  );
}
