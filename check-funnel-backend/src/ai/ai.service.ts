import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SystemSettingsService } from '../system-settings/system-settings.service';

@Injectable()
export class AiService {
  constructor(private systemSettingsService: SystemSettingsService) {}

  async generateCompletion(prompt: string, responseFormat?: any) {
    const settings = await this.systemSettingsService.getSettings();
    const apiKey = settings.openRouterApiKey;
    const model = settings.openRouterModel || 'google/gemini-2.0-flash-001';

    if (!apiKey) {
      throw new HttpException(
        'OpenRouter API Key is not configured in System Settings.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://checkfunnel.com',
          'X-OpenRouter-Title': 'Check Funnel',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: responseFormat || { type: 'json_object' },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenRouter Error:', errorData);
        throw new HttpException(
          errorData.error?.message || 'Failed to generate response from AI.',
          response.status,
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'An unexpected error occurred while connecting to the AI service.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
