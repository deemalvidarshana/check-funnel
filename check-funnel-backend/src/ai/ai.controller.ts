import { Controller, Post, Body, UseGuards } from '@nestjs/common'; 
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
}
