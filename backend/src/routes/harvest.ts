import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface CreateHarvestBody {
  fieldBedCropId: string;
  harvestAmount: string;
  harvestUnit: string;
  yieldPercentage?: string;
  harvestDate: string;
  notes?: string;
}

interface UpdateHarvestBody {
  harvestAmount?: string;
  harvestUnit?: string;
  yieldPercentage?: string;
  harvestDate?: string;
  notes?: string;
}

interface YieldDataByCrop {
  cropId: string;
  cropName: string;
  totalHarvest: number;
  totalHarvestUnit: string;
  averageYield: number;
  harvestCount: number;
  plantingDetails: {
    fieldBedCropId: string;
    fieldBedName: string;
    plantingDate: Date;
    harvests: Array<{
      id: string;
      harvestAmount: number;
      harvestUnit: string;
      yieldPercentage: number | null;
      harvestDate: Date;
    }>;
  }[];
}

// Helper function to update storage after harvest
async function updateHarvestStorage(
  app: App,
  userId: string,
  harvestAmount: number,
  cropName: string
): Promise<void> {
  // Vegetables and fruits use cold storage
  const coldStorageCrops = ['tomato', 'pepper', 'lettuce', 'carrot', 'strawberry', 'apple', 'grape'];
  const usesColdStorage = coldStorageCrops.some((crop) =>
    cropName.toLowerCase().includes(crop.toLowerCase())
  );

  // Calculate storage volume: harvestAmount * 0.05 cubic feet per unit
  const storageVolume = harvestAmount * 0.05;

  // Get first inventory item for user to update storage
  const items = await app.db.query.inventory.findMany({
    where: eq(schema.inventory.userId, userId),
  });

  if (items.length === 0) return;

  const firstItem = items[0];
  const storageField = usesColdStorage ? 'cold' : 'dry';
  const currentValue = usesColdStorage
    ? (firstItem.coldStorageUsed ? parseFloat(firstItem.coldStorageUsed) : 0)
    : (firstItem.dryStorageUsed ? parseFloat(firstItem.dryStorageUsed) : 0);

  const newValue = currentValue + storageVolume;

  const updateData: Record<string, any> = {};
  if (usesColdStorage) {
    updateData.coldStorageUsed = newValue.toString();
  } else {
    updateData.dryStorageUsed = newValue.toString();
  }

  await app.db
    .update(schema.inventory)
    .set(updateData)
    .where(eq(schema.inventory.id, firstItem.id));

  app.logger.info(
    {
      storageType: storageField,
      harvestAmount,
      storageVolume,
      oldValue: currentValue,
      newValue,
    },
    'Harvest storage usage updated'
  );
}

export function registerHarvestRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/harvest/yield - Get yield data grouped by crop type
  app.fastify.get<{}>(
    '/api/harvest/yield',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching yield data by crop');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Fetch all harvests for user
        const userHarvests = await app.db.query.harvests.findMany({
          where: eq(schema.harvests.userId, session.user.id),
          with: {
            crop: true,
            fieldBedCrop: {
              with: {
                fieldBed: true,
              },
            },
          },
        });

        // Group by crop and create yield summary
        const yieldByCropMap = new Map<string, YieldDataByCrop>();

        for (const harvest of userHarvests) {
          const cropId = harvest.cropId;
          const cropName = harvest.crop.name;

          if (!yieldByCropMap.has(cropId)) {
            yieldByCropMap.set(cropId, {
              cropId,
              cropName,
              totalHarvest: 0,
              totalHarvestUnit: harvest.harvestUnit,
              averageYield: 0,
              harvestCount: 0,
              plantingDetails: [],
            });
          }

          const yieldData = yieldByCropMap.get(cropId)!;
          yieldData.harvestCount += 1;
          yieldData.totalHarvest += parseFloat(harvest.harvestAmount.toString());

          // Find or create planting detail entry
          let plantingDetail = yieldData.plantingDetails.find(
            (pd) => pd.fieldBedCropId === harvest.fieldBedCropId
          );

          if (!plantingDetail) {
            plantingDetail = {
              fieldBedCropId: harvest.fieldBedCropId,
              fieldBedName: harvest.fieldBedCrop.fieldBed.name,
              plantingDate: harvest.fieldBedCrop.plantingDate,
              harvests: [],
            };
            yieldData.plantingDetails.push(plantingDetail);
          }

          plantingDetail.harvests.push({
            id: harvest.id,
            harvestAmount: parseFloat(harvest.harvestAmount.toString()),
            harvestUnit: harvest.harvestUnit,
            yieldPercentage: harvest.yieldPercentage ? parseFloat(harvest.yieldPercentage.toString()) : null,
            harvestDate: harvest.harvestDate,
          });
        }

        // Calculate average yield
        for (const yieldData of yieldByCropMap.values()) {
          const yieldPercentages = yieldData.plantingDetails
            .flatMap((pd) => pd.harvests)
            .filter((h) => h.yieldPercentage !== null)
            .map((h) => h.yieldPercentage as number);

          yieldData.averageYield =
            yieldPercentages.length > 0
              ? yieldPercentages.reduce((sum, val) => sum + val, 0) / yieldPercentages.length
              : 0;
        }

        const yieldDataArray = Array.from(yieldByCropMap.values());

        app.logger.info(
          { cropsWithHarvest: yieldDataArray.length },
          'Yield data fetched successfully'
        );

        return yieldDataArray;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch yield data');
        throw error;
      }
    }
  );

  // POST /api/harvest - Record new harvest data
  app.fastify.post<{ Body: CreateHarvestBody }>(
    '/api/harvest',
    async (request: FastifyRequest<{ Body: CreateHarvestBody }>, reply: FastifyReply) => {
      const { fieldBedCropId, harvestAmount, harvestUnit, yieldPercentage, harvestDate, notes } =
        request.body;

      app.logger.info(
        { fieldBedCropId, harvestAmount, harvestUnit },
        'Recording harvest data'
      );

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Get field bed crop to extract crop ID
        const fieldBedCrop = await app.db.query.fieldBedCrops.findFirst({
          where: eq(schema.fieldBedCrops.id, fieldBedCropId),
        });

        if (!fieldBedCrop) {
          return reply.status(404).send({ error: 'Field bed crop not found' });
        }

        // Get crop info for storage calculation
        const crop = await app.db.query.crops.findFirst({
          where: eq(schema.crops.id, fieldBedCrop.cropId),
        });

        const [harvest] = await app.db
          .insert(schema.harvests)
          .values({
            userId: session.user.id,
            fieldBedCropId,
            cropId: fieldBedCrop.cropId,
            harvestAmount: parseFloat(harvestAmount).toString(),
            harvestUnit,
            yieldPercentage: yieldPercentage ? parseFloat(yieldPercentage).toString() : undefined,
            harvestDate: new Date(harvestDate),
            notes,
          })
          .returning();

        // Update storage usage based on harvest
        if (crop) {
          await updateHarvestStorage(app, session.user.id, parseFloat(harvestAmount), crop.name);
        }

        app.logger.info(
          { harvestId: harvest.id, fieldBedCropId, harvestAmount },
          'Harvest data recorded and storage updated'
        );

        return harvest;
      } catch (error) {
        app.logger.error(
          { err: error, fieldBedCropId },
          'Failed to record harvest data'
        );
        throw error;
      }
    }
  );

  // PUT /api/harvest/:id - Update existing harvest data
  app.fastify.put<{ Params: { id: string }; Body: UpdateHarvestBody }>(
    '/api/harvest/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateHarvestBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { harvestAmount, harvestUnit, yieldPercentage, harvestDate, notes } = request.body;

      app.logger.info({ harvestId: id }, 'Updating harvest data');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const updateData: any = {};
        if (harvestAmount !== undefined)
          updateData.harvestAmount = parseFloat(harvestAmount).toString();
        if (harvestUnit !== undefined) updateData.harvestUnit = harvestUnit;
        if (yieldPercentage !== undefined)
          updateData.yieldPercentage = yieldPercentage ? parseFloat(yieldPercentage).toString() : undefined;
        if (harvestDate !== undefined) updateData.harvestDate = new Date(harvestDate);
        if (notes !== undefined) updateData.notes = notes;

        const [harvest] = await app.db
          .update(schema.harvests)
          .set(updateData)
          .where(eq(schema.harvests.id, id))
          .returning();

        app.logger.info({ harvestId: id }, 'Harvest data updated successfully');

        return harvest;
      } catch (error) {
        app.logger.error({ err: error, harvestId: id }, 'Failed to update harvest data');
        throw error;
      }
    }
  );

  // DELETE /api/harvest/:id - Delete harvest record
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/harvest/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ harvestId: id }, 'Deleting harvest record');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        await app.db.delete(schema.harvests).where(eq(schema.harvests.id, id));

        app.logger.info({ harvestId: id }, 'Harvest record deleted successfully');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, harvestId: id }, 'Failed to delete harvest record');
        throw error;
      }
    }
  );

  // GET /api/harvest/:fieldBedCropId - Get all harvests for a specific field bed crop
  app.fastify.get<{ Params: { fieldBedCropId: string } }>(
    '/api/harvest/:fieldBedCropId',
    async (
      request: FastifyRequest<{ Params: { fieldBedCropId: string } }>,
      reply: FastifyReply
    ) => {
      const { fieldBedCropId } = request.params;

      app.logger.info({ fieldBedCropId }, 'Fetching harvests for field bed crop');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const harvests = await app.db.query.harvests.findMany({
          where: eq(schema.harvests.fieldBedCropId, fieldBedCropId),
        });

        app.logger.info(
          { fieldBedCropId, count: harvests.length },
          'Harvests fetched successfully'
        );

        return harvests;
      } catch (error) {
        app.logger.error({ err: error, fieldBedCropId }, 'Failed to fetch harvests');
        throw error;
      }
    }
  );
}
