import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface CreateEquipmentListingBody {
  title: string;
  description: string;
  type: 'buy' | 'sell' | 'trade';
  price?: string;
  imageKey?: string;
}

interface UpdateEquipmentListingBody {
  title?: string;
  description?: string;
  price?: string;
  isActive?: boolean;
}

interface CreateInquiryBody {
  message: string;
}

export function registerEquipmentMarketplaceRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/marketplace/equipment - Get all equipment listings
  app.fastify.get<{}>(
    '/api/marketplace/equipment',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching equipment marketplace listings');

      try {
        const listings = await app.db.query.equipmentListings.findMany({
          with: {
            inquiries: true,
          },
        });

        app.logger.info({ count: listings.length }, 'Equipment listings fetched successfully');

        return listings;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch equipment listings');
        throw error;
      }
    }
  );

  // POST /api/marketplace/equipment - Create equipment listing
  app.fastify.post<{ Body: CreateEquipmentListingBody }>(
    '/api/marketplace/equipment',
    async (request: FastifyRequest<{ Body: CreateEquipmentListingBody }>, reply: FastifyReply) => {
      const { title, description, type, price, imageKey } = request.body;

      app.logger.info({ title, type }, 'Creating equipment listing');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const [listing] = await app.db
          .insert(schema.equipmentListings)
          .values({
            userId: session.user.id,
            title,
            description,
            type: type as any,
            price: price ? parseFloat(price).toString() : null,
            imageKey,
          })
          .returning();

        app.logger.info({ listingId: listing.id, title }, 'Equipment listing created successfully');

        return listing;
      } catch (error) {
        app.logger.error({ err: error, title, type }, 'Failed to create equipment listing');
        throw error;
      }
    }
  );

  // PATCH /api/marketplace/equipment/:id - Update equipment listing
  app.fastify.patch<{ Params: { id: string }; Body: UpdateEquipmentListingBody }>(
    '/api/marketplace/equipment/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateEquipmentListingBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { title, description, price, isActive } = request.body;

      app.logger.info({ listingId: id }, 'Updating equipment listing');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = parseFloat(price).toString();
        if (isActive !== undefined) updateData.isActive = isActive;

        const [listing] = await app.db
          .update(schema.equipmentListings)
          .set(updateData)
          .where(eq(schema.equipmentListings.id, id))
          .returning();

        app.logger.info({ listingId: id }, 'Equipment listing updated successfully');

        return listing;
      } catch (error) {
        app.logger.error({ err: error, listingId: id }, 'Failed to update equipment listing');
        throw error;
      }
    }
  );

  // DELETE /api/marketplace/equipment/:id - Delete equipment listing
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/marketplace/equipment/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ listingId: id }, 'Deleting equipment listing');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        await app.db.delete(schema.equipmentListings).where(eq(schema.equipmentListings.id, id));

        app.logger.info({ listingId: id }, 'Equipment listing deleted successfully');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, listingId: id }, 'Failed to delete equipment listing');
        throw error;
      }
    }
  );

  // GET /api/marketplace/equipment/:id/inquiries - Get inquiries for a listing
  app.fastify.get<{ Params: { id: string } }>(
    '/api/marketplace/equipment/:id/inquiries',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ listingId: id }, 'Fetching inquiries for listing');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const inquiries = await app.db.query.equipmentInquiries.findMany({
          where: eq(schema.equipmentInquiries.listingId, id),
        });

        app.logger.info({ listingId: id, count: inquiries.length }, 'Inquiries fetched successfully');

        return inquiries;
      } catch (error) {
        app.logger.error({ err: error, listingId: id }, 'Failed to fetch inquiries');
        throw error;
      }
    }
  );

  // POST /api/marketplace/equipment/:id/inquiries - Create inquiry
  app.fastify.post<{ Params: { id: string }; Body: CreateInquiryBody }>(
    '/api/marketplace/equipment/:id/inquiries',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: CreateInquiryBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { message } = request.body;

      app.logger.info({ listingId: id }, 'Creating inquiry');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const [inquiry] = await app.db
          .insert(schema.equipmentInquiries)
          .values({
            listingId: id,
            inquirerUserId: session.user.id,
            message,
          })
          .returning();

        app.logger.info({ inquiryId: inquiry.id, listingId: id }, 'Inquiry created successfully');

        return inquiry;
      } catch (error) {
        app.logger.error({ err: error, listingId: id }, 'Failed to create inquiry');
        throw error;
      }
    }
  );
}
