import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface UpdateStorageBody {
  coldStorageCapacity?: number;
  coldStorageUsed?: number;
  dryStorageCapacity?: number;
  dryStorageUsed?: number;
}

interface StorageInfo {
  coldStorageCapacity?: number;
  coldStorageUsed?: number;
  dryStorageCapacity?: number;
  dryStorageUsed?: number;
  coldStoragePercentage?: number;
  dryStoragePercentage?: number;
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: string;
  reorderLevel: string;
}

interface StorageAlert {
  type: 'cold' | 'dry';
  percentage: number;
  message: string;
}

interface AlertsResponse {
  lowStockItems: LowStockItem[];
  storageAlerts: StorageAlert[];
}

export function registerInventoryStorageRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // PUT /api/inventory/storage - Update storage capacity and usage
  app.fastify.put<{ Body: UpdateStorageBody }>(
    '/api/inventory/storage',
    async (request: FastifyRequest<{ Body: UpdateStorageBody }>, reply: FastifyReply) => {
      const { coldStorageCapacity, coldStorageUsed, dryStorageCapacity, dryStorageUsed } = request.body;

      app.logger.info({}, 'Updating inventory storage');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Get first inventory item for user (for user's storage settings)
        // In real app, might have a dedicated storage settings table
        let inventoryItem = await app.db.query.inventory.findFirst({
          where: eq(schema.inventory.userId, session.user.id),
        });

        const updateData: Record<string, any> = {};
        if (coldStorageCapacity !== undefined) {
          updateData.coldStorageCapacity = parseFloat(coldStorageCapacity.toString()).toString();
        }
        if (coldStorageUsed !== undefined) {
          updateData.coldStorageUsed = parseFloat(coldStorageUsed.toString()).toString();
        }
        if (dryStorageCapacity !== undefined) {
          updateData.dryStorageCapacity = parseFloat(dryStorageCapacity.toString()).toString();
        }
        if (dryStorageUsed !== undefined) {
          updateData.dryStorageUsed = parseFloat(dryStorageUsed.toString()).toString();
        }
        updateData.lastAlertDate = new Date();

        if (inventoryItem) {
          // Update existing
          const [updated] = await app.db
            .update(schema.inventory)
            .set(updateData)
            .where(eq(schema.inventory.id, inventoryItem.id))
            .returning();

          const storage: StorageInfo = {
            coldStorageCapacity: updated.coldStorageCapacity
              ? parseFloat(updated.coldStorageCapacity)
              : undefined,
            coldStorageUsed: updated.coldStorageUsed ? parseFloat(updated.coldStorageUsed) : undefined,
            dryStorageCapacity: updated.dryStorageCapacity
              ? parseFloat(updated.dryStorageCapacity)
              : undefined,
            dryStorageUsed: updated.dryStorageUsed ? parseFloat(updated.dryStorageUsed) : undefined,
          };

          // Calculate percentages
          if (storage.coldStorageCapacity && storage.coldStorageUsed) {
            storage.coldStoragePercentage = Math.round(
              (storage.coldStorageUsed / storage.coldStorageCapacity) * 100
            );
          }
          if (storage.dryStorageCapacity && storage.dryStorageUsed) {
            storage.dryStoragePercentage = Math.round(
              (storage.dryStorageUsed / storage.dryStorageCapacity) * 100
            );
          }

          app.logger.info({}, 'Storage updated successfully');

          return { success: true, storage };
        } else {
          app.logger.warn({}, 'No inventory items found for user');
          return reply
            .status(404)
            .send({ error: 'Create an inventory item first before setting storage' });
        }
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to update storage');
        throw error;
      }
    }
  );

  // GET /api/inventory/storage - Get current storage info
  app.fastify.get<{}>(
    '/api/inventory/storage',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching storage info');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Get all inventory items and aggregate storage info
        const items = await app.db.query.inventory.findMany({
          where: eq(schema.inventory.userId, session.user.id),
        });

        // Use first item's storage settings (or aggregate if multiple)
        const firstItem = items[0];

        if (!firstItem) {
          return {
            coldStorageCapacity: undefined,
            coldStorageUsed: undefined,
            dryStorageCapacity: undefined,
            dryStorageUsed: undefined,
            coldStoragePercentage: undefined,
            dryStoragePercentage: undefined,
          };
        }

        const storage: StorageInfo = {
          coldStorageCapacity: firstItem.coldStorageCapacity
            ? parseFloat(firstItem.coldStorageCapacity)
            : undefined,
          coldStorageUsed: firstItem.coldStorageUsed ? parseFloat(firstItem.coldStorageUsed) : undefined,
          dryStorageCapacity: firstItem.dryStorageCapacity
            ? parseFloat(firstItem.dryStorageCapacity)
            : undefined,
          dryStorageUsed: firstItem.dryStorageUsed ? parseFloat(firstItem.dryStorageUsed) : undefined,
        };

        // Calculate percentages
        if (storage.coldStorageCapacity && storage.coldStorageUsed) {
          storage.coldStoragePercentage = Math.round(
            (storage.coldStorageUsed / storage.coldStorageCapacity) * 100
          );
        }
        if (storage.dryStorageCapacity && storage.dryStorageUsed) {
          storage.dryStoragePercentage = Math.round(
            (storage.dryStorageUsed / storage.dryStorageCapacity) * 100
          );
        }

        app.logger.info({}, 'Storage info fetched successfully');

        return storage;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch storage info');
        throw error;
      }
    }
  );

  // GET /api/inventory/alerts - Get inventory alerts for low stock and low storage
  app.fastify.get<{}>(
    '/api/inventory/alerts',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching inventory alerts');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Get all inventory items for user
        const items = await app.db.query.inventory.findMany({
          where: eq(schema.inventory.userId, session.user.id),
        });

        // Find low stock items
        const lowStockItems: LowStockItem[] = items
          .filter((item) => {
            const qty = parseFloat(item.quantity);
            const reorder = item.reorderLevel ? parseFloat(item.reorderLevel) : null;
            return reorder && qty <= reorder;
          })
          .map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            reorderLevel: item.reorderLevel || '0',
          }));

        // Check storage alerts
        const storageAlerts: StorageAlert[] = [];

        if (items.length > 0) {
          const firstItem = items[0];

          if (
            firstItem.coldStorageCapacity &&
            firstItem.coldStorageUsed
          ) {
            const coldPercent = Math.round(
              (parseFloat(firstItem.coldStorageUsed) / parseFloat(firstItem.coldStorageCapacity)) *
                100
            );
            if (coldPercent >= 80) {
              storageAlerts.push({
                type: 'cold',
                percentage: coldPercent,
                message: `Cold storage is ${coldPercent}% full - consider cleaning or expanding`,
              });
            }
          }

          if (
            firstItem.dryStorageCapacity &&
            firstItem.dryStorageUsed
          ) {
            const dryPercent = Math.round(
              (parseFloat(firstItem.dryStorageUsed) / parseFloat(firstItem.dryStorageCapacity)) *
                100
            );
            if (dryPercent >= 80) {
              storageAlerts.push({
                type: 'dry',
                percentage: dryPercent,
                message: `Dry storage is ${dryPercent}% full - consider cleaning or expanding`,
              });
            }
          }
        }

        const response: AlertsResponse = {
          lowStockItems,
          storageAlerts,
        };

        app.logger.info(
          { lowStockCount: lowStockItems.length, alertCount: storageAlerts.length },
          'Inventory alerts fetched successfully'
        );

        return response;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch inventory alerts');
        throw error;
      }
    }
  );
}
