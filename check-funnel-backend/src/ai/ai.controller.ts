import { Controller, Post, Body, UseGuards } from '@nestjs/common'; 
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  private parseJsonContent(result: string) {
    try {
      return JSON.parse(result);
    } catch {
      const jsonObjectMatch = result.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          return JSON.parse(jsonObjectMatch[0]);
        } catch {
          // Keep deterministic targets visible if AI wraps JSON badly.
        }
      }

      return {
        summary: 'AI returned a non-JSON response, but deterministic targets were calculated successfully.',
        confidence: 'low',
        priorities: [],
        risks: ['AI response could not be parsed.'],
        raw: result,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-calendar')
  async generateCalendar(@Body('prompt') prompt: string) {
    const isRefinement = prompt.includes('ORIGINAL CONTENT TO REFINE') || prompt.includes('REFINE the specific social media post');

    const calendarSchema = {
      type: 'json_schema',
      json_schema: {
        name: 'social_media_calendar',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            posts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  contentType: { type: 'string' },
                  pillar: { type: 'string' },
                  visualCopy: { type: 'string' },
                  caption: { type: 'string' },
                  platforms: { type: 'string' },
                  status: { type: 'string' }
                },
                required: ['date', 'contentType', 'pillar', 'visualCopy', 'caption', 'platforms', 'status'],
                additionalProperties: false
              }
            }
          },
          required: ['posts'],
          additionalProperties: false
        }
      }
    };

    const refinementSchema = {
      type: 'json_schema',
      json_schema: {
        name: 'refine_post',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            contentType: { type: 'string' },
            pillar: { type: 'string' },
            visualCopy: { type: 'string' },
            caption: { type: 'string' },
            status: { type: 'string' }
          },
          required: ['contentType', 'pillar', 'visualCopy', 'caption', 'status'],
          additionalProperties: false
        }
      }
    };

    const schema = isRefinement ? refinementSchema : calendarSchema;
    const result = await this.aiService.generateCompletion(prompt, schema);
    
    try {
      // Robust extraction of JSON array using regex
      const jsonArrayMatch = result.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonArrayMatch) {
        const jsonStr = jsonArrayMatch[0];
        return JSON.parse(jsonStr);
      }

      // If no array found, try to find a JSON object
      const jsonObjectMatch = result.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        const jsonStr = jsonObjectMatch[0];
        const parsed = JSON.parse(jsonStr);
        // if it's an object with a common posts property, return that
        if (parsed.posts && Array.isArray(parsed.posts)) return parsed.posts;
        if (parsed.calendar && Array.isArray(parsed.calendar)) return parsed.calendar;
        if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
        if (parsed.content && Array.isArray(parsed.content)) return parsed.content;
        return parsed;
      }

      console.warn('AI response did not contain a valid JSON structure:', result);
      return { raw: result };
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      console.log('Raw Result was:', result);
      return { raw: result, error: 'Failed to parse JSON' };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-targets')
  async generateTargets(@Body() payload: any) {
    const targetSchema = {
      type: 'json_schema',
      json_schema: {
        name: 'target_recommendations',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            confidence: { type: 'string' },
            priorities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  clientName: { type: 'string' },
                  metric: { type: 'string' },
                  target: { type: 'string' },
                  rationale: { type: 'string' },
                  action: { type: 'string' },
                },
                required: ['clientName', 'metric', 'target', 'rationale', 'action'],
                additionalProperties: false,
              },
            },
            risks: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['summary', 'confidence', 'priorities', 'risks'],
          additionalProperties: false,
        },
      },
    };

    const safePayload = {
      platform: payload?.platform,
      generatedAt: payload?.generatedAt,
      rule: payload?.rule,
      clients: Array.isArray(payload?.clients) ? payload.clients.slice(0, 12) : [],
    };

    const prompt = `
You are Check Funnel's performance target analyst.
Use only the supplied live target data. Do not invent clients, months, or metrics.
The deterministic targets are already calculated as max(completed-month average * 1.4, small-account minimum floor).
Review the target set, identify practical priorities, and explain any small-account floor usage in plain business language.
Return compact JSON that matches the schema.

TARGET DATA:
${JSON.stringify(safePayload, null, 2)}
`;

    const result = await this.aiService.generateCompletion(prompt, targetSchema);
    return this.parseJsonContent(result);
  }
}
