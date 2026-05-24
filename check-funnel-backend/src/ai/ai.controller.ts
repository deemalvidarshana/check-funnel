import { Controller, Post, Body, UseGuards } from '@nestjs/common'; 
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  private redactInsightValue(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) => this.redactInsightValue(item));
    }

    if (value && typeof value === 'object') {
      return Object.entries(value).reduce((result, [key, nestedValue]) => {
        const lowerKey = key.toLowerCase();

        if (
          lowerKey.includes('apikey') ||
          lowerKey.includes('token') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('password')
        ) {
          return result;
        }

        result[key] = this.redactInsightValue(nestedValue);
        return result;
      }, {} as Record<string, any>);
    }

    return value;
  }

  private normalizeChatHistory(history: any) {
    if (!Array.isArray(history)) return [];

    return history
      .filter((message) => ['assistant', 'user'].includes(message?.role))
      .map((message) => ({
        role: message.role,
        content: String(message.content || '').trim().slice(0, 2000),
      }))
      .filter((message) => message.content)
      .slice(-24);
  }

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

  @UseGuards(JwtAuthGuard)
  @Post('generate-reel-script')
  async generateReelScript(@Body() payload: any) {
    const reelScriptSchema = {
      type: 'json_schema',
      json_schema: {
        name: 'reel_script',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            script: { type: 'string' },
          },
          required: ['script'],
          additionalProperties: false,
        },
      },
    };

    const prompt = String(payload?.prompt || '').trim();
    const result = await this.aiService.generateCompletion(prompt, reelScriptSchema);
    return this.parseJsonContent(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('insight-chat')
  async insightChat(@Body() payload: any) {
    const answerSchema = {
      type: 'json_schema',
      json_schema: {
        name: 'insight_chat_answer',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
          },
          required: ['answer'],
          additionalProperties: false,
        },
      },
    };

    const question = String(payload?.question || '').trim();
    const context = payload?.context || {};
    const history = this.normalizeChatHistory(payload?.history);

    const safeContext = this.redactInsightValue({
      clientName: context.clientName,
      platform: context.platform,
      platformLabel: context.platformLabel,
      activeTab: context.activeTab,
      timeRange: context.timeRange,
      chart: {
        title: context.chart?.title,
        subtitle: context.chart?.subtitle,
        metrics: Array.isArray(context.chart?.metrics)
          ? context.chart.metrics
          : [],
        rows: Array.isArray(context.chart?.rows)
          ? context.chart.rows
          : [],
        comparisonRows: Array.isArray(context.chart?.comparisonRows)
          ? context.chart.comparisonRows
          : [],
      },
      tableRows: Array.isArray(context.tableRows)
        ? context.tableRows
        : [],
      overview: Array.isArray(context.overview)
        ? context.overview
        : context.overview,
      platformStats: context.platformStats || null,
    });

    const prompt = `
You are Check Funnel's insights assistant inside a client analytics dashboard.
Act like an expert social media performance strategist who gives practical, human-friendly recommendations.
Answer the user's question using ONLY the supplied dashboard context.
The context is for the currently selected tab/platform/range, so prioritize that data.
Use the conversation memory only to understand follow-up questions and previous user preferences. If memory conflicts with the current dashboard context, trust the current dashboard context.
If the data needed is missing, say that it is not available in the current view and suggest the exact tab/platform/range to check if obvious.
Do not invent metrics, dates, platforms, or causes.
Give the user a clear recommendation, explain why it matters, and add practical next steps when the data supports them.
Make the answer deep enough to be useful, but avoid long generic advice.
Write in the same language/style as the user's question with a warm, natural tone.
When useful, mention exact numbers from the context and connect them to the recommendation.
Return JSON only with { "answer": "..." }.

CONVERSATION MEMORY:
${JSON.stringify(history, null, 2)}

USER QUESTION:
${question}

DASHBOARD CONTEXT:
${JSON.stringify(safeContext, null, 2)}
`;

    const result = await this.aiService.generateCompletion(prompt, answerSchema);
    return this.parseJsonContent(result);
  }
}
