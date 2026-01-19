import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { generateObject } from 'ai';
import { gateway } from '@specific-dev/framework';
import { eq, and } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

interface CreateSeasonBody {
  name: string;
  startDate: string;
  notes?: string;
}

interface CloseSeasonBody {}

interface GenerateEstimatesBody {
  location: string;
  cropIds: string[];
}

interface UpdateEstimateBody {
  estimatedYieldAmount?: number;
  estimatedMarketPrice?: number;
  estimatedCosts?: number;
}

interface UpdateActualsBody {
  cropId: string;
  harvestAmount?: number;
  revenue?: number;
  costs?: number;
}

interface SeasonResponse {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
}

interface EstimateResponse {
  cropId: string;
  cropName: string;
  estimatedYield: string;
  estimatedPrice: string;
  estimatedRevenue: string;
  estimatedCosts: string;
  estimatedProfit: string;
}

interface EstimateItemSchema {
  cropName: string;
  estimatedYieldAmount: number;
  estimatedYieldUnit: string;
  estimatedMarketPrice: number;
  marketData?: {
    pricePerUnit: string;
    trend: string;
    demand: string;
    confidence: number;
    sources: string[];
  };
}

const marketAnalysisSchema = z.object({
  crops: z.array(
    z.object({
      cropName: z.string(),
      estimatedYieldAmount: z.number(),
      estimatedYieldUnit: z.string(),
      estimatedMarketPrice: z.number(),
      marketData: z
        .object({
          pricePerUnit: z.string(),
          trend: z.string(),
          demand: z.string(),
          confidence: z.number(),
          sources: z.array(z.string()),
        })
        .optional(),
    })
  ),
});

export function registerSeasonRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/seasons - Get all seasons for user
  app.fastify.get<{}>(
    '/api/seasons',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching user seasons');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const userSeasons = await app.db.query.seasons.findMany({
          where: eq(schema.seasons.userId, session.user.id),
        });

        const response: SeasonResponse[] = userSeasons.map((s) => ({
          id: s.id,
          name: s.name,
          startDate: s.startDate,
          endDate: s.endDate || undefined,
          isActive: s.isActive,
          notes: s.notes || undefined,
          createdAt: s.createdAt,
        }));

        app.logger.info({ count: response.length }, 'Seasons fetched successfully');

        return response;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch seasons');
        throw error;
      }
    }
  );

  // POST /api/seasons - Create new season
  app.fastify.post<{ Body: CreateSeasonBody }>(
    '/api/seasons',
    async (request: FastifyRequest<{ Body: CreateSeasonBody }>, reply: FastifyReply) => {
      const { name, startDate, notes } = request.body;

      app.logger.info({ name }, 'Creating new season');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Deactivate all active seasons for this user
        await app.db
          .update(schema.seasons)
          .set({ isActive: false })
          .where(
            and(eq(schema.seasons.userId, session.user.id), eq(schema.seasons.isActive, true))
          );

        // Create new season
        const [season] = await app.db
          .insert(schema.seasons)
          .values({
            userId: session.user.id,
            name,
            startDate: new Date(startDate),
            isActive: true,
            notes: notes || null,
          })
          .returning();

        const response: SeasonResponse = {
          id: season.id,
          name: season.name,
          startDate: season.startDate,
          endDate: season.endDate || undefined,
          isActive: season.isActive,
          notes: season.notes || undefined,
          createdAt: season.createdAt,
        };

        app.logger.info({ seasonId: season.id, name }, 'Season created successfully');

        return response;
      } catch (error) {
        app.logger.error({ err: error, name }, 'Failed to create season');
        throw error;
      }
    }
  );

  // GET /api/seasons/:id - Get season details with estimates and actuals
  app.fastify.get<{ Params: { id: string } }>(
    '/api/seasons/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ seasonId: id }, 'Fetching season details');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const season = await app.db.query.seasons.findFirst({
          where: and(eq(schema.seasons.id, id), eq(schema.seasons.userId, session.user.id)),
          with: { yieldEstimates: { with: { crop: true } }, actuals: { with: { crop: true } } },
        });

        if (!season) {
          app.logger.warn({ seasonId: id }, 'Season not found');
          return reply.status(404).send({ error: 'Season not found' });
        }

        const estimates: EstimateResponse[] = season.yieldEstimates.map((e) => ({
          cropId: e.cropId,
          cropName: e.crop.name,
          estimatedYield: `${e.estimatedYieldAmount} ${e.estimatedYieldUnit}`,
          estimatedPrice: e.estimatedMarketPrice,
          estimatedRevenue: e.estimatedRevenue,
          estimatedCosts: e.estimatedCosts,
          estimatedProfit: e.estimatedProfit,
        }));

        const actuals = season.actuals.map((a) => ({
          cropId: a.cropId,
          cropName: a.crop.name,
          actualYield: `${a.actualYieldAmount} ${a.actualYieldUnit}`,
          actualRevenue: a.actualRevenue,
          actualCosts: a.actualCosts,
          actualProfit: a.actualProfit,
          varianceYield: a.varianceYield || null,
          varianceProfit: a.varianceProfit || null,
        }));

        // Calculate totals
        const totalEstimatedProfit = season.yieldEstimates.reduce(
          (sum, e) => sum + parseFloat(e.estimatedProfit),
          0
        );
        const totalActualProfit = season.actuals.reduce(
          (sum, a) => sum + parseFloat(a.actualProfit),
          0
        );
        const totalCosts = season.actuals.reduce(
          (sum, a) => sum + parseFloat(a.actualCosts),
          0
        );
        const totalRevenue = season.actuals.reduce(
          (sum, a) => sum + parseFloat(a.actualRevenue),
          0
        );

        const response = {
          season: {
            id: season.id,
            name: season.name,
            startDate: season.startDate,
            endDate: season.endDate,
            isActive: season.isActive,
            notes: season.notes,
          },
          estimates,
          actuals,
          currentProgress: {
            totalEstimatedProfit: totalEstimatedProfit.toString(),
            totalActualProfit: totalActualProfit.toString(),
            totalCosts: totalCosts.toString(),
            totalRevenue: totalRevenue.toString(),
          },
        };

        app.logger.info({ seasonId: id }, 'Season details fetched successfully');

        return response;
      } catch (error) {
        app.logger.error({ err: error, seasonId: id }, 'Failed to fetch season details');
        throw error;
      }
    }
  );

  // POST /api/seasons/:id/close - Close out a season
  app.fastify.post<{ Params: { id: string }; Body: CloseSeasonBody }>(
    '/api/seasons/:id/close',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: CloseSeasonBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      app.logger.info({ seasonId: id }, 'Closing season');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const season = await app.db.query.seasons.findFirst({
          where: and(eq(schema.seasons.id, id), eq(schema.seasons.userId, session.user.id)),
        });

        if (!season) {
          app.logger.warn({ seasonId: id }, 'Season not found');
          return reply.status(404).send({ error: 'Season not found' });
        }

        // Update season
        const [updatedSeason] = await app.db
          .update(schema.seasons)
          .set({
            endDate: new Date(),
            isActive: false,
          })
          .where(eq(schema.seasons.id, id))
          .returning();

        app.logger.info({ seasonId: id }, 'Season closed successfully');

        return {
          success: true,
          season: {
            id: updatedSeason.id,
            endDate: updatedSeason.endDate,
            isActive: updatedSeason.isActive,
          },
        };
      } catch (error) {
        app.logger.error({ err: error, seasonId: id }, 'Failed to close season');
        throw error;
      }
    }
  );

  // POST /api/seasons/:id/estimates/generate - Generate AI-powered estimates
  app.fastify.post<{ Params: { id: string }; Body: GenerateEstimatesBody }>(
    '/api/seasons/:id/estimates/generate',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: GenerateEstimatesBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { location, cropIds } = request.body;

      app.logger.info({ seasonId: id, location, cropCount: cropIds.length }, 'Generating estimates');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Fetch crops
        const crops = await app.db.query.crops.findMany({
          where: (field, { inArray }) => inArray(field.id, cropIds),
        });

        // Generate market analysis using AI
        const { object: analysis } = await generateObject({
          model: gateway('openai/gpt-5.2-mini'),
          schema: marketAnalysisSchema,
          schemaName: 'MarketAnalysis',
          schemaDescription:
            'Analyze market prices for crops in a specific location and generate yield estimates.',
          prompt: `Analyze current market prices for the following crops in ${location}:
${crops.map((c) => `- ${c.name}`).join('\n')}

For each crop, provide:
1. Estimated market price per unit (based on current market conditions)
2. Market trend (increasing, stable, or decreasing)
3. Demand forecast (low, medium, or high)
4. Confidence level (0-100)
5. Data sources

Assume an average field size of 500 sq ft and typical yields for the region.
Return estimated yield amounts based on typical farming conditions.`,
        });

        const estimates = [];

        for (const crop of crops) {
          const cropAnalysis = analysis.crops.find(
            (c) => c.cropName.toLowerCase() === crop.name.toLowerCase()
          );

          if (cropAnalysis) {
            const estimatedYieldAmount = cropAnalysis.estimatedYieldAmount || 100;
            const estimatedMarketPrice = cropAnalysis.estimatedMarketPrice || 5.0;
            const estimatedRevenue = estimatedYieldAmount * estimatedMarketPrice;
            const estimatedProfit = estimatedRevenue;

            // Insert estimate
            const [estimate] = await app.db
              .insert(schema.seasonYieldEstimates)
              .values({
                seasonId: id,
                cropId: crop.id,
                estimatedYieldAmount: estimatedYieldAmount.toString(),
                estimatedYieldUnit: 'lbs',
                estimatedMarketPrice: estimatedMarketPrice.toString(),
                estimatedRevenue: estimatedRevenue.toString(),
                estimatedProfit: estimatedProfit.toString(),
                marketData: cropAnalysis.marketData as any,
              })
              .returning();

            estimates.push({
              cropId: estimate.cropId,
              estimatedYield: `${estimate.estimatedYieldAmount} ${estimate.estimatedYieldUnit}`,
              estimatedPrice: estimate.estimatedMarketPrice,
              estimatedRevenue: estimate.estimatedRevenue,
              marketData: estimate.marketData,
            });
          }
        }

        app.logger.info({ seasonId: id, estimateCount: estimates.length }, 'Estimates generated successfully');

        return { estimates };
      } catch (error) {
        app.logger.error(
          { err: error, seasonId: id, location },
          'Failed to generate estimates'
        );
        throw error;
      }
    }
  );

  // PUT /api/seasons/:id/estimates/:cropId - Update estimate
  app.fastify.put<{ Params: { id: string; cropId: string }; Body: UpdateEstimateBody }>(
    '/api/seasons/:id/estimates/:cropId',
    async (
      request: FastifyRequest<{ Params: { id: string; cropId: string }; Body: UpdateEstimateBody }>,
      reply: FastifyReply
    ) => {
      const { id, cropId } = request.params;
      const { estimatedYieldAmount, estimatedMarketPrice, estimatedCosts } = request.body;

      app.logger.info({ seasonId: id, cropId }, 'Updating estimate');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const estimate = await app.db.query.seasonYieldEstimates.findFirst({
          where: and(
            eq(schema.seasonYieldEstimates.seasonId, id),
            eq(schema.seasonYieldEstimates.cropId, cropId)
          ),
        });

        if (!estimate) {
          app.logger.warn({ seasonId: id, cropId }, 'Estimate not found');
          return reply.status(404).send({ error: 'Estimate not found' });
        }

        const updateData: Record<string, any> = {};
        let yieldAmount = parseFloat(estimate.estimatedYieldAmount);
        let marketPrice = parseFloat(estimate.estimatedMarketPrice);
        let costs = parseFloat(estimate.estimatedCosts);

        if (estimatedYieldAmount !== undefined) {
          yieldAmount = estimatedYieldAmount;
          updateData.estimatedYieldAmount = yieldAmount.toString();
        }
        if (estimatedMarketPrice !== undefined) {
          marketPrice = estimatedMarketPrice;
          updateData.estimatedMarketPrice = marketPrice.toString();
        }
        if (estimatedCosts !== undefined) {
          costs = estimatedCosts;
          updateData.estimatedCosts = costs.toString();
        }

        // Calculate new revenue and profit
        const revenue = yieldAmount * marketPrice;
        updateData.estimatedRevenue = revenue.toString();
        updateData.estimatedProfit = (revenue - costs).toString();

        const [updated] = await app.db
          .update(schema.seasonYieldEstimates)
          .set(updateData)
          .where(
            and(
              eq(schema.seasonYieldEstimates.seasonId, id),
              eq(schema.seasonYieldEstimates.cropId, cropId)
            )
          )
          .returning();

        app.logger.info({ seasonId: id, cropId }, 'Estimate updated successfully');

        return {
          id: updated.id,
          cropId: updated.cropId,
          estimatedYield: `${updated.estimatedYieldAmount} ${updated.estimatedYieldUnit}`,
          estimatedPrice: updated.estimatedMarketPrice,
          estimatedRevenue: updated.estimatedRevenue,
          estimatedCosts: updated.estimatedCosts,
          estimatedProfit: updated.estimatedProfit,
        };
      } catch (error) {
        app.logger.error({ err: error, seasonId: id, cropId }, 'Failed to update estimate');
        throw error;
      }
    }
  );

  // GET /api/seasons/:id/progress - Get real-time season progress
  app.fastify.get<{ Params: { id: string } }>(
    '/api/seasons/:id/progress',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ seasonId: id }, 'Fetching season progress');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const season = await app.db.query.seasons.findFirst({
          where: and(eq(schema.seasons.id, id), eq(schema.seasons.userId, session.user.id)),
          with: {
            yieldEstimates: { with: { crop: true } },
            actuals: { with: { crop: true } },
          },
        });

        if (!season) {
          return reply.status(404).send({ error: 'Season not found' });
        }

        // Calculate estimate totals
        const estimateTotals = {
          totalYield: season.yieldEstimates.reduce(
            (sum, e) => sum + parseFloat(e.estimatedYieldAmount),
            0
          ),
          totalRevenue: season.yieldEstimates.reduce(
            (sum, e) => sum + parseFloat(e.estimatedRevenue),
            0
          ),
          totalCosts: season.yieldEstimates.reduce(
            (sum, e) => sum + parseFloat(e.estimatedCosts),
            0
          ),
          totalProfit: season.yieldEstimates.reduce(
            (sum, e) => sum + parseFloat(e.estimatedProfit),
            0
          ),
        };

        // Calculate actual totals
        const actualTotals = {
          totalYield: season.actuals.reduce(
            (sum, a) => sum + parseFloat(a.actualYieldAmount),
            0
          ),
          totalRevenue: season.actuals.reduce(
            (sum, a) => sum + parseFloat(a.actualRevenue),
            0
          ),
          totalCosts: season.actuals.reduce(
            (sum, a) => sum + parseFloat(a.actualCosts),
            0
          ),
          totalProfit: season.actuals.reduce(
            (sum, a) => sum + parseFloat(a.actualProfit),
            0
          ),
        };

        // Calculate progress percentages
        const progress = {
          yieldPercentage:
            estimateTotals.totalYield > 0
              ? Math.round((actualTotals.totalYield / estimateTotals.totalYield) * 100)
              : 0,
          revenuePercentage:
            estimateTotals.totalRevenue > 0
              ? Math.round((actualTotals.totalRevenue / estimateTotals.totalRevenue) * 100)
              : 0,
          profitPercentage:
            estimateTotals.totalProfit > 0
              ? Math.round((actualTotals.totalProfit / estimateTotals.totalProfit) * 100)
              : 0,
        };

        // Build by-crop breakdown
        const byCrop = season.yieldEstimates.map((est) => {
          const actual = season.actuals.find((a) => a.cropId === est.cropId);
          return {
            cropId: est.cropId,
            cropName: est.crop.name,
            estimated: {
              yield: `${est.estimatedYieldAmount} ${est.estimatedYieldUnit}`,
              revenue: est.estimatedRevenue,
              profit: est.estimatedProfit,
            },
            actual: actual
              ? {
                  yield: `${actual.actualYieldAmount} ${actual.actualYieldUnit}`,
                  revenue: actual.actualRevenue,
                  profit: actual.actualProfit,
                }
              : null,
            progress: actual
              ? Math.round((parseFloat(actual.actualYieldAmount) / parseFloat(est.estimatedYieldAmount)) * 100)
              : 0,
          };
        });

        const response = {
          estimates: estimateTotals,
          actuals: actualTotals,
          progress,
          byCrop,
        };

        app.logger.info({ seasonId: id }, 'Season progress fetched successfully');

        return response;
      } catch (error) {
        app.logger.error({ err: error, seasonId: id }, 'Failed to fetch season progress');
        throw error;
      }
    }
  );

  // POST /api/seasons/:id/actuals/update - Update actuals
  app.fastify.post<{ Params: { id: string }; Body: UpdateActualsBody }>(
    '/api/seasons/:id/actuals/update',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateActualsBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { cropId, harvestAmount, revenue, costs } = request.body;

      app.logger.info({ seasonId: id, cropId }, 'Updating season actuals');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        let actual = await app.db.query.seasonActuals.findFirst({
          where: and(
            eq(schema.seasonActuals.seasonId, id),
            eq(schema.seasonActuals.cropId, cropId)
          ),
        });

        if (!actual) {
          // Create new actual record
          const [newActual] = await app.db
            .insert(schema.seasonActuals)
            .values({
              seasonId: id,
              cropId,
              actualYieldAmount: (harvestAmount || 0).toString(),
              actualYieldUnit: 'lbs',
              actualRevenue: (revenue || 0).toString(),
              actualCosts: (costs || 0).toString(),
              actualProfit: ((revenue || 0) - (costs || 0)).toString(),
            })
            .returning();

          actual = newActual;
        } else {
          // Update existing
          const updateData: Record<string, any> = {};
          if (harvestAmount !== undefined) {
            updateData.actualYieldAmount = harvestAmount.toString();
          }
          if (revenue !== undefined) {
            updateData.actualRevenue = revenue.toString();
          }
          if (costs !== undefined) {
            updateData.actualCosts = costs.toString();
          }

          // Calculate profit
          const finalRevenue = revenue !== undefined ? revenue : parseFloat(actual.actualRevenue);
          const finalCosts = costs !== undefined ? costs : parseFloat(actual.actualCosts);
          updateData.actualProfit = (finalRevenue - finalCosts).toString();

          const [updated] = await app.db
            .update(schema.seasonActuals)
            .set(updateData)
            .where(
              and(
                eq(schema.seasonActuals.seasonId, id),
                eq(schema.seasonActuals.cropId, cropId)
              )
            )
            .returning();

          actual = updated;
        }

        app.logger.info({ seasonId: id, cropId }, 'Season actuals updated successfully');

        return {
          success: true,
          actuals: {
            actualYield: `${actual.actualYieldAmount} ${actual.actualYieldUnit}`,
            actualRevenue: actual.actualRevenue,
            actualCosts: actual.actualCosts,
            actualProfit: actual.actualProfit,
          },
        };
      } catch (error) {
        app.logger.error({ err: error, seasonId: id, cropId }, 'Failed to update actuals');
        throw error;
      }
    }
  );
}
