import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { generateText, generateObject } from 'ai';
import { gateway } from '@specific-dev/framework';
import { eq, and } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

interface WeatherForecastResponse {
  location: string;
  current: {
    temp: number;
    condition: string;
    humidity: number;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitation: number;
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    description: string;
    date: string;
  }>;
}

interface WeatherAnalysisRequest {
  location: string;
  schedules: Array<{
    id: string;
    taskType: string;
    dueDate: string;
    cropName: string;
  }>;
}

interface WeatherRecommendation {
  scheduleId: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
}

interface WeatherAnalysisResponse {
  insights: string;
  recommendations: WeatherRecommendation[];
}

const weatherRecommendationSchema = z.object({
  recommendation: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
});

type WeatherRecommendationType = z.infer<typeof weatherRecommendationSchema>;

// Mock weather data generator
function generateMockWeather(location: string): WeatherForecastResponse {
  const today = new Date();
  const forecast = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    forecast.push({
      date: date.toISOString().split('T')[0],
      high: 72 + Math.random() * 15,
      low: 55 + Math.random() * 12,
      condition: ['Clear', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
      precipitation: Math.random() * 0.5,
    });
  }

  return {
    location,
    current: {
      temp: 68,
      condition: 'Partly Cloudy',
      humidity: 65,
    },
    forecast,
    alerts: [
      {
        type: 'frost',
        severity: 'medium',
        description: 'Light frost expected in 3-4 days',
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  };
}

export function registerWeatherRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // GET /api/weather/forecast - Get weather forecast and alerts
  app.fastify.get<{ Querystring: { location?: string } }>(
    '/api/weather/forecast',
    async (request: FastifyRequest<{ Querystring: { location?: string } }>, reply: FastifyReply) => {
      const { location } = request.query;

      app.logger.info({ location }, 'Fetching weather forecast');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Use provided location or default to a sample location
        const targetLocation = location || 'New York';

        // Generate mock weather data (in production, would call real weather API)
        const weatherData = generateMockWeather(targetLocation);

        // Fetch weather alerts from database for this location
        const alerts = await app.db.query.weatherAlerts.findMany({
          where: and(
            eq(schema.weatherAlerts.userId, session.user.id),
            eq(schema.weatherAlerts.location, targetLocation)
          ),
        });

        // Merge database alerts with forecast alerts
        const mergedAlerts = [
          ...weatherData.alerts,
          ...alerts.map((alert) => ({
            type: alert.alertType,
            severity: alert.severity,
            description: alert.description,
            date: alert.forecastDate.toISOString().split('T')[0],
          })),
        ];

        const response: WeatherForecastResponse = {
          ...weatherData,
          alerts: mergedAlerts,
        };

        app.logger.info(
          { location: targetLocation, alertCount: mergedAlerts.length },
          'Weather forecast fetched successfully'
        );

        return response;
      } catch (error) {
        app.logger.error({ err: error, location }, 'Failed to fetch weather forecast');
        throw error;
      }
    }
  );

  // POST /api/weather/analyze - Analyze weather and generate recommendations
  app.fastify.post<{ Body: WeatherAnalysisRequest }>(
    '/api/weather/analyze',
    async (
      request: FastifyRequest<{ Body: WeatherAnalysisRequest }>,
      reply: FastifyReply
    ) => {
      const { location, schedules } = request.body;

      app.logger.info({ location, scheduleCount: schedules.length }, 'Analyzing weather for schedules');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Get weather forecast for location
        const weatherData = generateMockWeather(location);

        // Get weather alerts from database
        const alerts = await app.db.query.weatherAlerts.findMany({
          where: and(
            eq(schema.weatherAlerts.userId, session.user.id),
            eq(schema.weatherAlerts.location, location)
          ),
        });

        // Format data for AI analysis
        const forecastSummary = weatherData.forecast
          .map(
            (f) =>
              `${f.date}: High ${Math.round(f.high)}°F, Low ${Math.round(f.low)}F, ${f.condition}, Precipitation: ${f.precipitation.toFixed(2)}"`
          )
          .join('\n');

        const alertsSummary = alerts
          .map(
            (a) =>
              `${a.alertType} (${a.severity}): ${a.description} on ${a.forecastDate.toISOString().split('T')[0]}`
          )
          .join('\n');

        // Generate overall insights using AI
        const { text: insights } = await generateText({
          model: gateway('openai/gpt-5.2-mini'),
          system: `You are an expert farming consultant analyzing weather patterns and their impact on farming schedules.
          Provide concise, actionable insights about the upcoming weather and how it affects farming operations.`,
          prompt: `Analyze this weather forecast and alerts for a farming location:

Forecast:
${forecastSummary}

Alerts:
${alertsSummary || 'No severe weather alerts'}

Provide 2-3 key insights about how this weather will impact farming operations in the next 7 days.`,
        });

        // Generate recommendations for each schedule
        const recommendations: WeatherRecommendation[] = [];

        for (const schedule of schedules) {
          // Generate specific recommendation for this task
          const { object: rec } = await generateObject({
            model: gateway('openai/gpt-5.2-mini'),
            schema: weatherRecommendationSchema,
            schemaName: 'WeatherRecommendation',
            schemaDescription:
              'Generate a weather-based farming recommendation for a scheduled task.',
            prompt: `Based on this weather forecast and the farming task, provide a specific recommendation:

Task: ${schedule.taskType} for ${schedule.cropName}
Due Date: ${schedule.dueDate}

Weather Forecast:
${forecastSummary}

Weather Alerts:
${alertsSummary || 'No severe weather alerts'}

Provide a specific recommendation considering:
- Is the current schedule date ideal for this task?
- Should the task be rescheduled based on weather?
- What are the weather-related risks?

Be specific with dates and actionable advice.`,
          });

          recommendations.push({
            scheduleId: schedule.id,
            recommendation: rec.recommendation,
            priority: rec.priority,
          });
        }

        const response: WeatherAnalysisResponse = {
          insights,
          recommendations,
        };

        app.logger.info(
          { location, recommendationCount: recommendations.length },
          'Weather analysis completed successfully'
        );

        return response;
      } catch (error) {
        app.logger.error({ err: error, location }, 'Failed to analyze weather');
        throw error;
      }
    }
  );

  // GET /api/schedules/with-weather - Get schedules with weather recommendations
  app.fastify.get<{}>(
    '/api/schedules/with-weather',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching schedules with weather recommendations');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Get all schedules for the user with relationships
        const schedules = await app.db.query.schedules.findMany({
          where: eq(schema.schedules.userId, session.user.id),
          with: {
            fieldBedCrop: {
              with: {
                fieldBed: true,
                crop: true,
              },
            },
          },
        });

        // Transform to include weather-relevant information
        const schedulesWithWeather = schedules.map((schedule) => ({
          id: schedule.id,
          fieldBed: {
            id: schedule.fieldBedCrop.fieldBed.id,
            name: schedule.fieldBedCrop.fieldBed.name,
          },
          crop: {
            id: schedule.fieldBedCrop.crop.id,
            name: schedule.fieldBedCrop.crop.name,
          },
          taskType: schedule.taskType,
          taskDescription: `${schedule.taskType.charAt(0).toUpperCase() + schedule.taskType.slice(1).replace('_', ' ')} ${schedule.fieldBedCrop.crop.name}`,
          dueDate: schedule.dueDate.toISOString().split('T')[0],
          completed: schedule.completed,
          weatherRecommendation: schedule.weatherRecommendation,
          weatherPriority: schedule.weatherPriority,
          notes: schedule.notes,
        }));

        app.logger.info(
          { count: schedulesWithWeather.length },
          'Schedules with weather fetched successfully'
        );

        return schedulesWithWeather;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch schedules with weather');
        throw error;
      }
    }
  );

  // PATCH /api/schedules/:id/weather - Update schedule with weather recommendation
  app.fastify.patch<{
    Params: { id: string };
    Body: { weatherRecommendation: string; weatherPriority: 'low' | 'medium' | 'high' };
  }>(
    '/api/schedules/:id/weather',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { weatherRecommendation: string; weatherPriority: 'low' | 'medium' | 'high' };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { weatherRecommendation, weatherPriority } = request.body;

      app.logger.info(
        { scheduleId: id, priority: weatherPriority },
        'Updating schedule with weather recommendation'
      );

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Update schedule with weather recommendation
        const [updated] = await app.db
          .update(schema.schedules)
          .set({
            weatherRecommendation,
            weatherPriority: weatherPriority as any,
          })
          .where(
            and(
              eq(schema.schedules.id, id),
              eq(schema.schedules.userId, session.user.id)
            )
          )
          .returning();

        if (!updated) {
          app.logger.warn({ scheduleId: id }, 'Schedule not found or not owned by user');
          return reply.status(404).send({ error: 'Schedule not found' });
        }

        app.logger.info(
          { scheduleId: id, priority: weatherPriority },
          'Schedule updated with weather recommendation'
        );

        return {
          id: updated.id,
          weatherRecommendation: updated.weatherRecommendation,
          weatherPriority: updated.weatherPriority,
        };
      } catch (error) {
        app.logger.error({ err: error, scheduleId: id }, 'Failed to update schedule');
        throw error;
      }
    }
  );
}
