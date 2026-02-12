import type { App } from '../index.js';
import { generateText, generateObject } from 'ai';
import { gateway } from '@specific-dev/framework';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

interface DiagnoseBody {
  description: string;
  imageBase64?: string;
}

interface CropRecommendationBody {
  climate?: string;
  soilType?: string;
  marketData?: string;
}

interface FarmingAdviceBody {
  question: string;
}

const diagnosisSchema = z.object({
  condition: z.string(),
  severity: z.enum(['low', 'moderate', 'high']),
  treatment: z.string(),
  prevention: z.string(),
});

const recommendationSchema = z.object({
  crops: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
      profitability: z.enum(['low', 'moderate', 'high']),
      difficulty: z.enum(['easy', 'moderate', 'difficult']),
    })
  ),
});

type Diagnosis = z.infer<typeof diagnosisSchema>;
type Recommendation = z.infer<typeof recommendationSchema>;

export function registerAiRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // POST /api/ai/diagnose-plant - Diagnose plant disease
  app.fastify.post<{ Body: DiagnoseBody }>(
    '/api/ai/diagnose-plant',
    async (request: FastifyRequest<{ Body: DiagnoseBody }>, reply: FastifyReply) => {
      const { description, imageBase64 } = request.body;

      app.logger.info({}, 'Processing plant disease diagnosis');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const messages: any[] = [];

        if (imageBase64) {
          messages.push({
            role: 'user',
            content: [
              {
                type: 'image',
                image: imageBase64,
              },
              {
                type: 'text',
                text: `Analyze this plant image and the following description for disease diagnosis: ${description}`,
              },
            ],
          });
        } else {
          messages.push({
            role: 'user',
            content: `Based on this plant description, provide a disease diagnosis: ${description}`,
          });
        }

        const { object: diagnosis } = await generateObject({
          model: gateway('openai/gpt-4o'),
          schema: diagnosisSchema,
          schemaName: 'PlantDiagnosis',
          schemaDescription:
            'Diagnose plant disease or condition based on description or image, with severity, treatment, and prevention advice',
          messages,
        });

        app.logger.info(
          { condition: diagnosis.condition, severity: diagnosis.severity },
          'Plant diagnosis completed successfully'
        );

        return diagnosis;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to diagnose plant');
        throw error;
      }
    }
  );

  // POST /api/ai/crop-recommendations - Get crop recommendations
  app.fastify.post<{ Body: CropRecommendationBody }>(
    '/api/ai/crop-recommendations',
    async (request: FastifyRequest<{ Body: CropRecommendationBody }>, reply: FastifyReply) => {
      const { climate, soilType, marketData } = request.body;

      app.logger.info({}, 'Generating crop recommendations');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Build prompt with provided data
        let prompt = 'Recommend profitable crops based on these conditions:\n';
        if (climate) prompt += `- Climate: ${climate}\n`;
        if (soilType) prompt += `- Soil Type: ${soilType}\n`;
        if (marketData) prompt += `- Market Data: ${marketData}\n`;
        prompt +=
          'Consider profitability, difficulty level, and market demand. Provide 5-7 crop recommendations.';

        const { object: recommendations } = await generateObject({
          model: gateway('openai/gpt-5-mini'),
          schema: recommendationSchema,
          schemaName: 'CropRecommendations',
          schemaDescription:
            'Generate crop recommendations based on climate, soil, and market data with profitability and difficulty ratings',
          prompt,
        });

        app.logger.info(
          { cropCount: recommendations.crops.length },
          'Crop recommendations generated successfully'
        );

        return recommendations;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to generate crop recommendations');
        throw error;
      }
    }
  );

  // POST /api/ai/farming-advice - Get farming advice
  app.fastify.post<{ Body: FarmingAdviceBody }>(
    '/api/ai/farming-advice',
    async (request: FastifyRequest<{ Body: FarmingAdviceBody }>, reply: FastifyReply) => {
      const { question } = request.body;

      app.logger.info({ questionLength: question.length }, 'Processing farming advice request');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const { text: advice } = await generateText({
          model: gateway('anthropic/claude-sonnet-4-5'),
          system: `You are an expert farming consultant helping small farm owners. Provide practical, actionable advice about:
- Crop growing and management
- Selling and marketing farm products
- Farm business operations
- Sustainable farming practices
Be concise and focus on practical tips that can be implemented immediately.`,
          prompt: question,
        });

        app.logger.info(
          { adviceLength: advice.length },
          'Farming advice generated successfully'
        );

        return { advice };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to generate farming advice');
        throw error;
      }
    }
  );
}
