import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface CreateInventoryBody {
  name: string;
  category: 'fertilizer' | 'seeds' | 'marketing_materials' | 'equipment' | 'other';
  quantity: string;
  unit: string;
}

interface UpdateInventoryBody {
  name?: string;
  quantity?: string;
  unit?: string;
}

export function registerInventoryRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/inventory - Get all inventory items for user
  app.fastify.get<{}>(
    '/api/inventory',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching inventory');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const inventoryItems = await app.db.query.inventory.findMany({
          where: eq(schema.inventory.userId, session.user.id),
        });

        app.logger.info({ count: inventoryItems.length }, 'Inventory fetched successfully');

        return inventoryItems;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch inventory');
        throw error;
      }
    }
  );

  // POST /api/inventory - Create inventory item
  app.fastify.post<{ Body: CreateInventoryBody }>(
    '/api/inventory',
    async (request: FastifyRequest<{ Body: CreateInventoryBody }>, reply: FastifyReply) => {
      const { name, category, quantity, unit } = request.body;

      app.logger.info({ name, category }, 'Creating inventory item');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const [item] = await app.db
          .insert(schema.inventory)
          .values({
            userId: session.user.id,
            name,
            category: category as any,
            quantity: parseFloat(quantity).toString(),
            unit,
          })
          .returning();

        app.logger.info({ itemId: item.id, name }, 'Inventory item created successfully');

        return item;
      } catch (error) {
        app.logger.error({ err: error, name, category }, 'Failed to create inventory item');
        throw error;
      }
    }
  );

  // PATCH /api/inventory/:id - Update inventory item
  app.fastify.patch<{ Params: { id: string }; Body: UpdateInventoryBody }>(
    '/api/inventory/:id',
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateInventoryBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { name, quantity, unit } = request.body;

      app.logger.info({ itemId: id }, 'Updating inventory item');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (quantity !== undefined) updateData.quantity = parseFloat(quantity).toString();
        if (unit !== undefined) updateData.unit = unit;

        const [item] = await app.db
          .update(schema.inventory)
          .set(updateData)
          .where(eq(schema.inventory.id, id))
          .returning();

        app.logger.info({ itemId: id }, 'Inventory item updated successfully');

        return item;
      } catch (error) {
        app.logger.error({ err: error, itemId: id }, 'Failed to update inventory item');
        throw error;
      }
    }
  );

  // DELETE /api/inventory/:id - Delete inventory item
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/inventory/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ itemId: id }, 'Deleting inventory item');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        await app.db.delete(schema.inventory).where(eq(schema.inventory.id, id));

        app.logger.info({ itemId: id }, 'Inventory item deleted successfully');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, itemId: id }, 'Failed to delete inventory item');
        throw error;
      }
    }
  );
}
