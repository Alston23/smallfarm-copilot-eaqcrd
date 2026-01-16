import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface GenerateScheduleBody {
  fieldBedCropId: string;
}

interface UpdateScheduleBody {
  completed?: boolean;
  completedDate?: string;
  notes?: string;
}

export function registerScheduleRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/schedules - Get all schedules for user
  app.fastify.get<{}>(
    '/api/schedules',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching schedules');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const schedulesList = await app.db.query.schedules.findMany({
          where: eq(schema.schedules.userId, session.user.id),
          with: {
            fieldBedCrop: {
              with: {
                crop: true,
                fieldBed: true,
              },
            },
          },
        });

        app.logger.info({ count: schedulesList.length }, 'Schedules fetched successfully');

        return schedulesList;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch schedules');
        throw error;
      }
    }
  );

  // POST /api/schedules/generate - Auto-generate schedule based on crop data
  app.fastify.post<{ Body: GenerateScheduleBody }>(
    '/api/schedules/generate',
    async (request: FastifyRequest<{ Body: GenerateScheduleBody }>, reply: FastifyReply) => {
      const { fieldBedCropId } = request.body;

      app.logger.info({ fieldBedCropId }, 'Generating schedule');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Fetch the field bed crop with crop details
        const fieldBedCrop = await app.db.query.fieldBedCrops.findFirst({
          where: eq(schema.fieldBedCrops.id, fieldBedCropId),
          with: {
            crop: true,
            fieldBed: true,
          },
        });

        if (!fieldBedCrop) {
          return reply.status(404).send({ error: 'Field bed crop not found' });
        }

        const plantingDate = new Date(fieldBedCrop.plantingDate);
        const daysToMaturity = fieldBedCrop.crop.daysToMaturity || 70;
        const harvestDate = new Date(plantingDate);
        harvestDate.setDate(harvestDate.getDate() + daysToMaturity);

        // Generate schedule tasks
        const scheduleTasks = [
          {
            taskType: 'water' as const,
            daysAfterPlanting: 3,
            description: 'Initial watering',
          },
          {
            taskType: 'fertilize' as const,
            daysAfterPlanting: 14,
            description: 'First fertilizer application',
          },
          {
            taskType: 'weed' as const,
            daysAfterPlanting: 21,
            description: 'Weeding and thinning',
          },
          {
            taskType: 'fertilize' as const,
            daysAfterPlanting: 35,
            description: 'Second fertilizer application',
          },
          {
            taskType: 'pest_control' as const,
            daysAfterPlanting: 42,
            description: 'Pest inspection and control if needed',
          },
          {
            taskType: 'water' as const,
            daysAfterPlanting: 50,
            description: 'Regular watering as needed',
          },
          {
            taskType: 'harvest' as const,
            daysAfterPlanting: daysToMaturity,
            description: 'Harvest',
          },
        ];

        const createdSchedules = [];
        for (const task of scheduleTasks) {
          const dueDate = new Date(plantingDate);
          dueDate.setDate(dueDate.getDate() + task.daysAfterPlanting);

          const [schedule] = await app.db
            .insert(schema.schedules)
            .values({
              userId: session.user.id,
              fieldBedCropId,
              taskType: task.taskType,
              dueDate,
              notes: task.description,
            })
            .returning();

          createdSchedules.push(schedule);
        }

        app.logger.info(
          { fieldBedCropId, taskCount: createdSchedules.length },
          'Schedule generated successfully'
        );

        return createdSchedules;
      } catch (error) {
        app.logger.error({ err: error, fieldBedCropId }, 'Failed to generate schedule');
        throw error;
      }
    }
  );

  // PATCH /api/schedules/:id - Update a schedule
  app.fastify.patch<{ Params: { id: string }; Body: UpdateScheduleBody }>(
    '/api/schedules/:id',
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateScheduleBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { completed, completedDate, notes } = request.body;

      app.logger.info({ scheduleId: id, completed }, 'Updating schedule');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const updateData: any = {};
        if (completed !== undefined) {
          updateData.completed = completed;
        }
        if (completedDate !== undefined) {
          updateData.completedDate = new Date(completedDate);
        }
        if (notes !== undefined) {
          updateData.notes = notes;
        }

        const [schedule] = await app.db
          .update(schema.schedules)
          .set(updateData)
          .where(eq(schema.schedules.id, id))
          .returning();

        app.logger.info({ scheduleId: id }, 'Schedule updated successfully');

        return schedule;
      } catch (error) {
        app.logger.error({ err: error, scheduleId: id }, 'Failed to update schedule');
        throw error;
      }
    }
  );

  // DELETE /api/schedules/:id - Delete a schedule
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/schedules/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ scheduleId: id }, 'Deleting schedule');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        await app.db.delete(schema.schedules).where(eq(schema.schedules.id, id));

        app.logger.info({ scheduleId: id }, 'Schedule deleted successfully');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, scheduleId: id }, 'Failed to delete schedule');
        throw error;
      }
    }
  );
}
