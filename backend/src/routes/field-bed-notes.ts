import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface CreateNoteBody {
  fieldBedId: string;
  noteType: 'photo' | 'voice';
  fileUrl: string;
  caption?: string;
}

interface NoteResponse {
  id: string;
  fieldBedId: string;
  noteType: 'photo' | 'voice';
  fileUrl: string;
  caption?: string;
  createdAt: Date;
}

export function registerFieldBedNotesRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // POST /api/field-bed-notes - Create a new note
  app.fastify.post<{ Body: CreateNoteBody }>(
    '/api/field-bed-notes',
    async (request: FastifyRequest<{ Body: CreateNoteBody }>, reply: FastifyReply) => {
      const { fieldBedId, noteType, fileUrl, caption } = request.body;

      app.logger.info({ fieldBedId, noteType }, 'Creating field bed note');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Verify field/bed ownership
        const fieldBed = await app.db.query.fieldsBeds.findFirst({
          where: eq(schema.fieldsBeds.id, fieldBedId),
        });

        if (!fieldBed || fieldBed.userId !== session.user.id) {
          app.logger.warn({ fieldBedId }, 'Field bed not found or not owned by user');
          return reply.status(404).send({ error: 'Field/bed not found' });
        }

        // Create note
        const [note] = await app.db
          .insert(schema.fieldBedNotes)
          .values({
            userId: session.user.id,
            fieldBedId,
            noteType: noteType as any,
            fileUrl,
            caption: caption || null,
          })
          .returning();

        const response: NoteResponse = {
          id: note.id,
          fieldBedId: note.fieldBedId,
          noteType: note.noteType as 'photo' | 'voice',
          fileUrl: note.fileUrl,
          caption: note.caption || undefined,
          createdAt: note.createdAt,
        };

        app.logger.info({ noteId: note.id, fieldBedId }, 'Field bed note created successfully');

        return response;
      } catch (error) {
        app.logger.error({ err: error, fieldBedId, noteType }, 'Failed to create field bed note');
        throw error;
      }
    }
  );

  // GET /api/field-bed-notes/:fieldBedId - Get all notes for a field/bed
  app.fastify.get<{ Params: { fieldBedId: string } }>(
    '/api/field-bed-notes/:fieldBedId',
    async (request: FastifyRequest<{ Params: { fieldBedId: string } }>, reply: FastifyReply) => {
      const { fieldBedId } = request.params;

      app.logger.info({ fieldBedId }, 'Fetching field bed notes');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Verify field/bed ownership
        const fieldBed = await app.db.query.fieldsBeds.findFirst({
          where: eq(schema.fieldsBeds.id, fieldBedId),
        });

        if (!fieldBed || fieldBed.userId !== session.user.id) {
          app.logger.warn({ fieldBedId }, 'Field bed not found or not owned by user');
          return reply.status(404).send({ error: 'Field/bed not found' });
        }

        // Get all notes for this field/bed
        const notes = await app.db.query.fieldBedNotes.findMany({
          where: eq(schema.fieldBedNotes.fieldBedId, fieldBedId),
        });

        const response: NoteResponse[] = notes.map((note) => ({
          id: note.id,
          fieldBedId: note.fieldBedId,
          noteType: note.noteType as 'photo' | 'voice',
          fileUrl: note.fileUrl,
          caption: note.caption || undefined,
          createdAt: note.createdAt,
        }));

        app.logger.info({ fieldBedId, count: response.length }, 'Field bed notes fetched successfully');

        return response;
      } catch (error) {
        app.logger.error({ err: error, fieldBedId }, 'Failed to fetch field bed notes');
        throw error;
      }
    }
  );

  // DELETE /api/field-bed-notes/:id - Delete a note
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/field-bed-notes/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ noteId: id }, 'Deleting field bed note');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Fetch note to verify ownership
        const note = await app.db.query.fieldBedNotes.findFirst({
          where: eq(schema.fieldBedNotes.id, id),
        });

        if (!note || note.userId !== session.user.id) {
          app.logger.warn({ noteId: id }, 'Note not found or not owned by user');
          return reply.status(404).send({ error: 'Note not found' });
        }

        // Delete note
        await app.db.delete(schema.fieldBedNotes).where(eq(schema.fieldBedNotes.id, id));

        app.logger.info({ noteId: id }, 'Field bed note deleted successfully');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, noteId: id }, 'Failed to delete field bed note');
        throw error;
      }
    }
  );
}
