import { app, type App } from '../index.js';
import { gateway } from '@specific-dev/framework';
import { generateText } from 'ai';
import { eq, desc, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface ChatBody {
  message: string;
  conversationId?: string;
}

interface ConversationResponse {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

interface MessageResponse {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface ChatResponse {
  response: string;
  conversationId: string;
  messageId: string;
}

const SYSTEM_PROMPT = `You are a helpful farming assistant for small farm owners. Provide practical advice about crops, livestock, weather, pest control, soil management, and sustainable farming practices. Be concise and actionable.`;

export function registerChatRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // POST /api/chat - Send message and get AI response
  app.fastify.post<{ Body: ChatBody }>(
    '/api/chat',
    async (request: FastifyRequest<{ Body: ChatBody }>, reply: FastifyReply) => {
      const { message, conversationId } = request.body;

      app.logger.info({ conversationId, messageLength: message.length }, 'Received chat message');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        let currentConversationId = conversationId;
        let conversationTitle = 'New Conversation';

        // Create new conversation if not provided
        if (!currentConversationId) {
          // Extract title from first message (first 50 chars)
          conversationTitle = message.substring(0, 50);

          const [newConversation] = await app.db
            .insert(schema.conversations)
            .values({
              userId: session.user.id,
              title: conversationTitle,
            })
            .returning();

          currentConversationId = newConversation.id;
          app.logger.info({ conversationId: currentConversationId }, 'Created new conversation');
        }

        // Fetch conversation history
        const history = await app.db.query.messages.findMany({
          where: eq(schema.messages.conversationId, currentConversationId),
          orderBy: schema.messages.createdAt,
        });

        app.logger.info({ conversationId: currentConversationId, historyLength: history.length }, 'Fetched conversation history');

        // Prepare messages for Claude (excluding system prompt)
        const messages = [
          ...history.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          {
            role: 'user' as const,
            content: message,
          },
        ];

        // Call Claude API
        const { text: aiResponse } = await generateText({
          model: gateway('anthropic/claude-sonnet-4-5'),
          system: SYSTEM_PROMPT,
          messages,
        });

        app.logger.info({ conversationId: currentConversationId, responseLength: aiResponse.length }, 'Generated AI response');

        // Save user message
        const [userMessage] = await app.db
          .insert(schema.messages)
          .values({
            conversationId: currentConversationId,
            role: 'user',
            content: message,
          })
          .returning();

        // Save assistant response
        const [assistantMessage] = await app.db
          .insert(schema.messages)
          .values({
            conversationId: currentConversationId,
            role: 'assistant',
            content: aiResponse,
          })
          .returning();

        // Update conversation timestamp
        await app.db
          .update(schema.conversations)
          .set({ updatedAt: new Date() })
          .where(eq(schema.conversations.id, currentConversationId));

        app.logger.info(
          {
            conversationId: currentConversationId,
            messageId: assistantMessage.id,
          },
          'Chat message processed successfully'
        );

        return {
          response: aiResponse,
          conversationId: currentConversationId,
          messageId: assistantMessage.id,
        } as ChatResponse;
      } catch (error) {
        app.logger.error({ err: error, conversationId, body: request.body }, 'Failed to process chat message');
        throw error;
      }
    }
  );

  // GET /api/conversations - Get all conversations
  app.fastify.get<{}>('/api/conversations', async (request: FastifyRequest, reply: FastifyReply) => {
    app.logger.info({}, 'Fetching all conversations');

    try {
      const conversationsList = await app.db.query.conversations.findMany({
        orderBy: desc(schema.conversations.updatedAt),
      });

      // Get message count for each conversation
      const conversationsWithCount: ConversationResponse[] = await Promise.all(
        conversationsList.map(async (conv) => {
          const [{ messageCount }] = await app.db
            .select({ messageCount: count(schema.messages.id) })
            .from(schema.messages)
            .where(eq(schema.messages.conversationId, conv.id));

          return {
            id: conv.id,
            title: conv.title,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            messageCount,
          };
        })
      );

      app.logger.info({ count: conversationsWithCount.length }, 'Conversations fetched successfully');

      return conversationsWithCount;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch conversations');
      throw error;
    }
  });

  // GET /api/conversations/:id/messages - Get messages for a conversation
  app.fastify.get<{ Params: { id: string } }>(
    '/api/conversations/:id/messages',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ conversationId: id }, 'Fetching messages for conversation');

      try {
        const messages = await app.db.query.messages.findMany({
          where: eq(schema.messages.conversationId, id),
          orderBy: schema.messages.createdAt,
        });

        app.logger.info({ conversationId: id, messageCount: messages.length }, 'Messages fetched successfully');

        return messages.map(
          (msg): MessageResponse => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
          })
        );
      } catch (error) {
        app.logger.error({ err: error, conversationId: id }, 'Failed to fetch messages');
        throw error;
      }
    }
  );

  // DELETE /api/conversations/:id - Delete a conversation
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/conversations/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ conversationId: id }, 'Deleting conversation');

      try {
        // Delete all messages (cascade will handle this, but being explicit)
        await app.db.delete(schema.messages).where(eq(schema.messages.conversationId, id));

        // Delete conversation
        await app.db.delete(schema.conversations).where(eq(schema.conversations.id, id));

        app.logger.info({ conversationId: id }, 'Conversation deleted successfully');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, conversationId: id }, 'Failed to delete conversation');
        throw error;
      }
    }
  );
}
