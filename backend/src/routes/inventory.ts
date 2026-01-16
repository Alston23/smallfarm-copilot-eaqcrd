import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

type InventoryCategory =
  | 'fertilizer'
  | 'seeds'
  | 'transplants'
  | 'value_added_materials'
  | 'pesticides'
  | 'tools'
  | 'packaging'
  | 'irrigation_supplies'
  | 'soil_amendments'
  | 'other';

interface CreateInventoryBody {
  name: string;
  category: InventoryCategory;
  subcategory?: string;
  quantity: string;
  unit: string;
  notes?: string;
  reorderLevel?: string;
}

interface UpdateInventoryBody {
  name?: string;
  subcategory?: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  reorderLevel?: string;
}

interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  category: InventoryCategory;
  subcategory: string | null;
  quantity: string;
  unit: string;
  notes: string | null;
  reorderLevel: string | null;
  createdAt: Date;
  updatedAt: Date;
  needsReorder?: boolean;
}

export function registerInventoryRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/inventory - Get all inventory items for user with status
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

        // Add reorder status to each item
        const itemsWithStatus: InventoryItem[] = inventoryItems.map((item: any) => ({
          ...item,
          needsReorder:
            item.reorderLevel && parseFloat(item.quantity) <= parseFloat(item.reorderLevel),
        }));

        app.logger.info(
          { count: itemsWithStatus.length },
          'Inventory fetched successfully'
        );

        return itemsWithStatus;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch inventory');
        throw error;
      }
    }
  );

  // POST /api/inventory - Create inventory item with full details
  app.fastify.post<{ Body: CreateInventoryBody }>(
    '/api/inventory',
    async (request: FastifyRequest<{ Body: CreateInventoryBody }>, reply: FastifyReply) => {
      const { name, category, subcategory, quantity, unit, notes, reorderLevel } =
        request.body;

      app.logger.info(
        { name, category, subcategory },
        'Creating inventory item'
      );

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const [item] = await app.db
          .insert(schema.inventory)
          .values({
            userId: session.user.id,
            name,
            category: category as any,
            subcategory,
            quantity: parseFloat(quantity).toString(),
            unit,
            notes,
            reorderLevel: reorderLevel ? parseFloat(reorderLevel).toString() : undefined,
          })
          .returning();

        const itemWithStatus: InventoryItem = {
          ...item,
          needsReorder:
            item.reorderLevel && parseFloat(item.quantity) <= parseFloat(item.reorderLevel),
        };

        app.logger.info(
          { itemId: item.id, name, category },
          'Inventory item created successfully'
        );

        return itemWithStatus;
      } catch (error) {
        app.logger.error(
          { err: error, name, category },
          'Failed to create inventory item'
        );
        throw error;
      }
    }
  );

  // PATCH /api/inventory/:id - Update inventory item with all fields
  app.fastify.patch<{ Params: { id: string }; Body: UpdateInventoryBody }>(
    '/api/inventory/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateInventoryBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { name, subcategory, quantity, unit, notes, reorderLevel } = request.body;

      app.logger.info({ itemId: id }, 'Updating inventory item');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (subcategory !== undefined) updateData.subcategory = subcategory;
        if (quantity !== undefined) updateData.quantity = parseFloat(quantity).toString();
        if (unit !== undefined) updateData.unit = unit;
        if (notes !== undefined) updateData.notes = notes;
        if (reorderLevel !== undefined)
          updateData.reorderLevel = reorderLevel ? parseFloat(reorderLevel).toString() : undefined;

        const [item] = await app.db
          .update(schema.inventory)
          .set(updateData)
          .where(eq(schema.inventory.id, id))
          .returning();

        const itemWithStatus: InventoryItem = {
          ...item,
          needsReorder:
            item.reorderLevel && parseFloat(item.quantity) <= parseFloat(item.reorderLevel),
        };

        app.logger.info({ itemId: id }, 'Inventory item updated successfully');

        return itemWithStatus;
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

  // GET /api/inventory/low-stock - Get items that need reordering
  app.fastify.get<{}>(
    '/api/inventory/low-stock',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching low stock items');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const allItems = await app.db.query.inventory.findMany({
          where: eq(schema.inventory.userId, session.user.id),
        });

        // Filter items that are below reorder level
        const lowStockItems = allItems.filter(
          (item: any) =>
            item.reorderLevel &&
            parseFloat(item.quantity) <= parseFloat(item.reorderLevel)
        );

        app.logger.info(
          { count: lowStockItems.length },
          'Low stock items fetched successfully'
        );

        return lowStockItems;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch low stock items');
        throw error;
      }
    }
  );

  // GET /api/inventory/categories - Get all available categories and subcategories
  app.fastify.get<{}>(
    '/api/inventory/categories',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching inventory categories');

      try {
        const categories = {
          fertilizer: [
            'Nitrogen Fertilizer',
            'Phosphorus Fertilizer',
            'Potassium Fertilizer',
            'Balanced Fertilizer',
            'Organic Fertilizer',
            'Compost',
            'Other',
          ],
          seeds: [
            'Vegetable Seeds',
            'Herb Seeds',
            'Flower Seeds',
            'Fruit Seeds',
            'Root Vegetable Seeds',
            'Legume Seeds',
            'Other',
          ],
          transplants: [
            'Vegetable Transplants',
            'Herb Transplants',
            'Flower Transplants',
            'Fruit Transplants',
            'Seedlings',
            'Other',
          ],
          value_added_materials: [
            'Flower Wraps',
            'Boxes',
            'Labels',
            'Bags',
            'Baskets',
            'Tissue Paper',
            'Other',
          ],
          pesticides: [
            'Insecticides',
            'Fungicides',
            'Herbicides',
            'Nematicides',
            'Natural/Organic',
            'Other',
          ],
          tools: [
            'Hand Tools',
            'Power Tools',
            'Hoses & Connectors',
            'Pruning Equipment',
            'Digging Equipment',
            'Other',
          ],
          packaging: [
            'Crates',
            'Jars',
            'Bottles',
            'Containers',
            'Wrapping Materials',
            'Other',
          ],
          irrigation_supplies: [
            'Drip Lines',
            'Sprinkler Heads',
            'Valves',
            'Fittings',
            'Emitters',
            'Tubing',
            'Other',
          ],
          soil_amendments: [
            'Peat Moss',
            'Coco Coir',
            'Perlite',
            'Vermiculite',
            'Sand',
            'Mulch',
            'Other',
          ],
          other: ['Miscellaneous'],
        };

        app.logger.info({}, 'Inventory categories retrieved successfully');

        return categories;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch inventory categories');
        throw error;
      }
    }
  );
}
