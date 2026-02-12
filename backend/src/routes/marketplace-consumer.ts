import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface CreateListingBody {
  cropId: string;
  outlet: 'restaurant' | 'farmers_market' | 'roadside_stand' | 'csa' | 'other';
  price: string;
  quantity: string;
  unit: string;
  imageKey?: string;
  description?: string;
}

interface CreateCustomerBody {
  name: string;
  outlet: string;
  contactInfo?: string;
}

interface CreateOrderBody {
  customerId: string;
  listingId: string;
  quantity: string;
}

interface UpdateListingBody {
  price?: string;
  quantity?: string;
  description?: string;
}

export function registerConsumerMarketplaceRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/marketplace/consumer - Get all consumer listings
  app.fastify.get<{}>(
    '/api/marketplace/consumer',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching consumer marketplace listings');

      try {
        const listings = await app.db.query.consumerListings.findMany({
          with: {
            crop: true,
            orders: true,
          },
        });

        app.logger.info({ count: listings.length }, 'Consumer listings fetched successfully');

        return listings;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch consumer listings');
        throw error;
      }
    }
  );

  // POST /api/marketplace/consumer - Create listing
  app.fastify.post<{ Body: CreateListingBody }>(
    '/api/marketplace/consumer',
    async (request: FastifyRequest<{ Body: CreateListingBody }>, reply: FastifyReply) => {
      const { cropId, outlet, price, quantity, unit, imageKey, description } = request.body;

      app.logger.info({ cropId, outlet }, 'Creating consumer listing');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const [listing] = await app.db
          .insert(schema.consumerListings)
          .values({
            userId: session.user.id,
            cropId,
            outlet: outlet as any,
            price: parseFloat(price).toString(),
            quantity: parseFloat(quantity).toString(),
            unit,
            imageKey,
            description,
          })
          .returning();

        app.logger.info({ listingId: listing.id, outlet }, 'Consumer listing created successfully');

        return listing;
      } catch (error) {
        app.logger.error({ err: error, cropId, outlet }, 'Failed to create consumer listing');
        throw error;
      }
    }
  );

  // PATCH /api/marketplace/consumer/:id - Update listing
  app.fastify.patch<{ Params: { id: string }; Body: UpdateListingBody }>(
    '/api/marketplace/consumer/:id',
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateListingBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { price, quantity, description } = request.body;

      app.logger.info({ listingId: id }, 'Updating consumer listing');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const updateData: any = {};
        if (price !== undefined) updateData.price = parseFloat(price).toString();
        if (quantity !== undefined) updateData.quantity = parseFloat(quantity).toString();
        if (description !== undefined) updateData.description = description;

        const [listing] = await app.db
          .update(schema.consumerListings)
          .set(updateData)
          .where(eq(schema.consumerListings.id, id))
          .returning();

        app.logger.info({ listingId: id }, 'Consumer listing updated successfully');

        return listing;
      } catch (error) {
        app.logger.error({ err: error, listingId: id }, 'Failed to update consumer listing');
        throw error;
      }
    }
  );

  // DELETE /api/marketplace/consumer/:id - Delete listing
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/marketplace/consumer/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ listingId: id }, 'Deleting consumer listing');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        await app.db.delete(schema.consumerListings).where(eq(schema.consumerListings.id, id));

        app.logger.info({ listingId: id }, 'Consumer listing deleted successfully');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, listingId: id }, 'Failed to delete consumer listing');
        throw error;
      }
    }
  );

  // GET /api/marketplace/consumer/customers - Get all customers
  app.fastify.get<{}>(
    '/api/marketplace/consumer/customers',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching customers');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const customers = await app.db.query.consumerCustomers.findMany({
          where: eq(schema.consumerCustomers.userId, session.user.id),
          with: {
            orders: true,
          },
        });

        app.logger.info({ count: customers.length }, 'Customers fetched successfully');

        return customers;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch customers');
        throw error;
      }
    }
  );

  // POST /api/marketplace/consumer/customers - Create customer
  app.fastify.post<{ Body: CreateCustomerBody }>(
    '/api/marketplace/consumer/customers',
    async (request: FastifyRequest<{ Body: CreateCustomerBody }>, reply: FastifyReply) => {
      const { name, outlet, contactInfo } = request.body;

      app.logger.info({ name, outlet }, 'Creating customer');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const [customer] = await app.db
          .insert(schema.consumerCustomers)
          .values({
            userId: session.user.id,
            name,
            outlet,
            contactInfo,
          })
          .returning();

        app.logger.info({ customerId: customer.id, name }, 'Customer created successfully');

        return customer;
      } catch (error) {
        app.logger.error({ err: error, name, outlet }, 'Failed to create customer');
        throw error;
      }
    }
  );

  // GET /api/marketplace/consumer/orders - Get all orders
  app.fastify.get<{}>(
    '/api/marketplace/consumer/orders',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching consumer orders');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const orders = await app.db.query.consumerOrders.findMany({
          where: eq(schema.consumerOrders.userId, session.user.id),
          with: {
            customer: true,
            listing: {
              with: {
                crop: true,
              },
            },
          },
        });

        app.logger.info({ count: orders.length }, 'Consumer orders fetched successfully');

        return orders;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch consumer orders');
        throw error;
      }
    }
  );

  // POST /api/marketplace/consumer/orders - Create order
  app.fastify.post<{ Body: CreateOrderBody }>(
    '/api/marketplace/consumer/orders',
    async (request: FastifyRequest<{ Body: CreateOrderBody }>, reply: FastifyReply) => {
      const { customerId, listingId, quantity } = request.body;

      app.logger.info({ customerId, listingId }, 'Creating consumer order');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const listing = await app.db.query.consumerListings.findFirst({
          where: eq(schema.consumerListings.id, listingId),
        });

        if (!listing) {
          return reply.status(404).send({ error: 'Listing not found' });
        }

        const quantityNum = parseFloat(quantity);
        const priceNum = parseFloat(listing.price.toString());
        const totalPrice = priceNum * quantityNum;

        const [order] = await app.db
          .insert(schema.consumerOrders)
          .values({
            userId: session.user.id,
            customerId,
            listingId,
            quantity: quantityNum.toString(),
            totalPrice: totalPrice.toString(),
            purchaseDate: new Date(),
          })
          .returning();

        app.logger.info(
          { orderId: order.id, customerId, totalPrice },
          'Consumer order created successfully'
        );

        return order;
      } catch (error) {
        app.logger.error({ err: error, customerId, listingId }, 'Failed to create consumer order');
        throw error;
      }
    }
  );
}
