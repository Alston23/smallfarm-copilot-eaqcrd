import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface CreateEquipmentBody {
  equipmentType: string;
  make: string;
  model: string;
  hours?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  serviceIntervalHours?: number;
  notes?: string;
}

interface UpdateEquipmentBody {
  equipmentType?: string;
  make?: string;
  model?: string;
  hours?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  serviceIntervalHours?: number;
  notes?: string;
}

interface EquipmentResponse {
  id: string;
  equipmentType: string;
  make: string;
  model: string;
  hours?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  serviceIntervalHours?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function registerEquipmentRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/equipment - Get all equipment for authenticated user
  app.fastify.get<{}>(
    '/api/equipment',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching user equipment');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const userEquipment = await app.db.query.equipment.findMany({
          where: eq(schema.equipment.userId, session.user.id),
        });

        // Transform to include readable format
        const equipment: EquipmentResponse[] = userEquipment.map((item) => ({
          id: item.id,
          equipmentType: item.equipmentType,
          make: item.make,
          model: item.model,
          hours: item.hours ? item.hours : undefined,
          lastServiceDate: item.lastServiceDate ? item.lastServiceDate.toISOString() : undefined,
          nextServiceDate: item.nextServiceDate ? item.nextServiceDate.toISOString() : undefined,
          serviceIntervalHours: item.serviceIntervalHours ? item.serviceIntervalHours : undefined,
          notes: item.notes || undefined,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

        app.logger.info({ count: equipment.length }, 'Equipment fetched successfully');

        return equipment;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch equipment');
        throw error;
      }
    }
  );

  // POST /api/equipment - Create new equipment
  app.fastify.post<{ Body: CreateEquipmentBody }>(
    '/api/equipment',
    async (request: FastifyRequest<{ Body: CreateEquipmentBody }>, reply: FastifyReply) => {
      const { equipmentType, make, model, hours, lastServiceDate, nextServiceDate, serviceIntervalHours, notes } =
        request.body;

      app.logger.info(
        { equipmentType, make, model },
        'Creating equipment'
      );

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Convert numeric strings to numeric values
        const hoursValue = hours !== undefined ? parseFloat(hours.toString()).toString() : null;
        const serviceIntervalValue = serviceIntervalHours !== undefined ? parseFloat(serviceIntervalHours.toString()).toString() : null;

        const [createdEquipment] = await app.db
          .insert(schema.equipment)
          .values({
            userId: session.user.id,
            equipmentType,
            make,
            model,
            hours: hoursValue as any,
            lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
            nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
            serviceIntervalHours: serviceIntervalValue as any,
            notes: notes || null,
          })
          .returning();

        const response: EquipmentResponse = {
          id: createdEquipment.id,
          equipmentType: createdEquipment.equipmentType,
          make: createdEquipment.make,
          model: createdEquipment.model,
          hours: createdEquipment.hours ? createdEquipment.hours : undefined,
          lastServiceDate: createdEquipment.lastServiceDate ? createdEquipment.lastServiceDate.toISOString() : undefined,
          nextServiceDate: createdEquipment.nextServiceDate ? createdEquipment.nextServiceDate.toISOString() : undefined,
          serviceIntervalHours: createdEquipment.serviceIntervalHours ? createdEquipment.serviceIntervalHours : undefined,
          notes: createdEquipment.notes || undefined,
          createdAt: createdEquipment.createdAt,
          updatedAt: createdEquipment.updatedAt,
        };

        app.logger.info({ equipmentId: createdEquipment.id, equipmentType }, 'Equipment created successfully');

        return response;
      } catch (error) {
        app.logger.error({ err: error, equipmentType, make, model }, 'Failed to create equipment');
        throw error;
      }
    }
  );

  // PUT /api/equipment/:id - Update equipment
  app.fastify.put<{ Params: { id: string }; Body: UpdateEquipmentBody }>(
    '/api/equipment/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateEquipmentBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { equipmentType, make, model, hours, lastServiceDate, nextServiceDate, serviceIntervalHours, notes } =
        request.body;

      app.logger.info({ equipmentId: id }, 'Updating equipment');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Build update object with only provided fields
        const updateData: Record<string, any> = {};

        if (equipmentType !== undefined) updateData.equipmentType = equipmentType;
        if (make !== undefined) updateData.make = make;
        if (model !== undefined) updateData.model = model;
        if (hours !== undefined) updateData.hours = parseFloat(hours.toString()).toString();
        if (lastServiceDate !== undefined) updateData.lastServiceDate = new Date(lastServiceDate);
        if (nextServiceDate !== undefined) updateData.nextServiceDate = new Date(nextServiceDate);
        if (serviceIntervalHours !== undefined) updateData.serviceIntervalHours = parseFloat(serviceIntervalHours.toString()).toString();
        if (notes !== undefined) updateData.notes = notes;

        const [updatedEquipment] = await app.db
          .update(schema.equipment)
          .set(updateData)
          .where(
            eq(schema.equipment.id, id)
          )
          .returning();

        if (!updatedEquipment) {
          app.logger.warn({ equipmentId: id }, 'Equipment not found');
          return reply.status(404).send({ error: 'Equipment not found' });
        }

        // Verify ownership
        if (updatedEquipment.userId !== session.user.id) {
          app.logger.warn({ equipmentId: id, userId: session.user.id }, 'Equipment not owned by user');
          return reply.status(403).send({ error: 'Not authorized to update this equipment' });
        }

        const response: EquipmentResponse = {
          id: updatedEquipment.id,
          equipmentType: updatedEquipment.equipmentType,
          make: updatedEquipment.make,
          model: updatedEquipment.model,
          hours: updatedEquipment.hours ? updatedEquipment.hours : undefined,
          lastServiceDate: updatedEquipment.lastServiceDate ? updatedEquipment.lastServiceDate.toISOString() : undefined,
          nextServiceDate: updatedEquipment.nextServiceDate ? updatedEquipment.nextServiceDate.toISOString() : undefined,
          serviceIntervalHours: updatedEquipment.serviceIntervalHours ? updatedEquipment.serviceIntervalHours : undefined,
          notes: updatedEquipment.notes || undefined,
          createdAt: updatedEquipment.createdAt,
          updatedAt: updatedEquipment.updatedAt,
        };

        app.logger.info({ equipmentId: id }, 'Equipment updated successfully');

        return response;
      } catch (error) {
        app.logger.error({ err: error, equipmentId: id }, 'Failed to update equipment');
        throw error;
      }
    }
  );

  // DELETE /api/equipment/:id - Delete equipment
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/equipment/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ equipmentId: id }, 'Deleting equipment');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // First fetch the equipment to verify ownership
        const equipmentToDelete = await app.db.query.equipment.findFirst({
          where: eq(schema.equipment.id, id),
        });

        if (!equipmentToDelete) {
          app.logger.warn({ equipmentId: id }, 'Equipment not found');
          return reply.status(404).send({ error: 'Equipment not found' });
        }

        if (equipmentToDelete.userId !== session.user.id) {
          app.logger.warn({ equipmentId: id, userId: session.user.id }, 'Equipment not owned by user');
          return reply.status(403).send({ error: 'Not authorized to delete this equipment' });
        }

        await app.db
          .delete(schema.equipment)
          .where(eq(schema.equipment.id, id));

        app.logger.info({ equipmentId: id }, 'Equipment deleted successfully');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, equipmentId: id }, 'Failed to delete equipment');
        throw error;
      }
    }
  );
}
