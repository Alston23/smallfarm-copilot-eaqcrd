import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface CreateFieldBedBody {
  name: string;
  type: 'field' | 'bed';
  squareFootage?: string;
  acreage?: string;
  irrigationType?: 'drip' | 'sprinkler' | 'flood' | 'manual' | 'none';
  soilType?: 'clay' | 'sandy' | 'loam' | 'silt' | 'peat' | 'chalk';
}

interface AssignCropBody {
  fieldBedId: string;
  cropId: string;
  plantingDate: string;
}

export function registerFieldsBedsRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/fields-beds - Get all fields and beds for user
  app.fastify.get<{}>(
    '/api/fields-beds',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching fields and beds');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const fieldsBedsList = await app.db.query.fieldsBeds.findMany({
          where: eq(schema.fieldsBeds.userId, session.user.id),
          with: {
            crops: {
              with: {
                crop: true,
              },
            },
          },
        });

        app.logger.info({ count: fieldsBedsList.length }, 'Fields and beds fetched successfully');

        return fieldsBedsList;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch fields and beds');
        throw error;
      }
    }
  );

  // POST /api/fields-beds - Create a new field or bed
  app.fastify.post<{ Body: CreateFieldBedBody }>(
    '/api/fields-beds',
    async (request: FastifyRequest<{ Body: CreateFieldBedBody }>, reply: FastifyReply) => {
      const { name, type, squareFootage, acreage, irrigationType, soilType } = request.body;

      app.logger.info({ name, type, irrigationType, soilType }, 'Creating field/bed');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const [fieldBed] = await app.db
          .insert(schema.fieldsBeds)
          .values({
            userId: session.user.id,
            name,
            type: type as any,
            squareFootage: squareFootage ? parseFloat(squareFootage).toString() : undefined,
            acreage: acreage ? parseFloat(acreage).toString() : undefined,
            irrigationType: irrigationType as any,
            soilType: soilType as any,
          })
          .returning();

        app.logger.info(
          { fieldBedId: fieldBed.id, name, irrigationType, soilType },
          'Field/bed created successfully'
        );

        return fieldBed;
      } catch (error) {
        app.logger.error({ err: error, name, type }, 'Failed to create field/bed');
        throw error;
      }
    }
  );

  // POST /api/fields-beds/:id/crops - Assign a crop to a field/bed
  app.fastify.post<{ Params: { id: string }; Body: Omit<AssignCropBody, 'fieldBedId'> }>(
    '/api/fields-beds/:id/crops',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Omit<AssignCropBody, 'fieldBedId'> }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { cropId, plantingDate } = request.body;

      app.logger.info({ fieldBedId: id, cropId }, 'Assigning crop to field/bed');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const [fieldBedCrop] = await app.db
          .insert(schema.fieldBedCrops)
          .values({
            fieldBedId: id,
            cropId,
            plantingDate: new Date(plantingDate),
          })
          .returning();

        app.logger.info(
          { fieldBedCropId: fieldBedCrop.id },
          'Crop assigned to field/bed successfully'
        );

        return fieldBedCrop;
      } catch (error) {
        app.logger.error({ err: error, fieldBedId: id, cropId }, 'Failed to assign crop');
        throw error;
      }
    }
  );

  // DELETE /api/fields-beds/:id - Delete a field/bed
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/fields-beds/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ fieldBedId: id }, 'Deleting field/bed');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        await app.db.delete(schema.fieldsBeds).where(eq(schema.fieldsBeds.id, id));

        app.logger.info({ fieldBedId: id }, 'Field/bed deleted successfully');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, fieldBedId: id }, 'Failed to delete field/bed');
        throw error;
      }
    }
  );
}
