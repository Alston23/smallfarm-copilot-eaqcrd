import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export function registerUploadRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // POST /api/upload/image - Upload image file
  app.fastify.post<{}>(
    '/api/upload/image',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Processing image upload');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const options = { limits: { fileSize: 10 * 1024 * 1024 } }; // 10MB limit
        const data = await request.file(options);

        if (!data) {
          return reply.status(400).send({ error: 'No file provided' });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.warn({ err }, 'File size limit exceeded');
          return reply.status(413).send({ error: 'File too large (max 10MB)' });
        }

        // Validate file type
        const mimeType = data.mimetype;
        if (!mimeType.startsWith('image/')) {
          app.logger.warn({ mimeType }, 'Invalid file type');
          return reply.status(400).send({ error: 'Only image files are allowed' });
        }

        // Generate storage key
        const timestamp = Date.now();
        const filename = data.filename || `image-${timestamp}`;
        const key = `uploads/${session.user.id}/${timestamp}-${filename}`;

        // Upload to storage
        const uploadedKey = await app.storage.upload(key, buffer);

        // Generate signed URL
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        app.logger.info(
          { userId: session.user.id, filesize: buffer.length, uploadedKey },
          'Image uploaded successfully'
        );

        return { url, key: uploadedKey, filename: data.filename };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to upload image');
        throw error;
      }
    }
  );
}
