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

    const parseOpenRouterError = (rawBody: string) => {
      if (!rawBody) return 'Failed to generate response from AI.';

      try {
        const parsed = JSON.parse(rawBody);
        return (
          parsed?.error?.message ||
          parsed?.message ||
          parsed?.error ||
          rawBody
        );
      } catch {
        return rawBody.slice(0, 500);
      }
    };

    const requestCompletion = async (format: any) => {
      const requestBody: Record<string, any> = {
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      };

      if (format) {
        requestBody.response_format = format;
      }

      let response: Response;

      try {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://checkfunnel.com',
            'X-OpenRouter-Title': 'Check Funnel',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      } catch (error) {
        throw new HttpException(
          'Could not reach OpenRouter. Check your internet connection, DNS/VPN/firewall settings, or try again in a moment.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const responseText = await response.text();

      if (!response.ok) {
        const message = parseOpenRouterError(responseText);
        console.error('OpenRouter Error:', {
          status: response.status,
          message,
        });
        throw new HttpException(
          message || 'Failed to generate response from AI.',
          response.status,
        );
      }

      const data = JSON.parse(responseText);
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new HttpException(
          'AI provider returned an empty response.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      try {
        const parsedContent = JSON.parse(content);
        const providerErrorMessage =
          parsedContent?.error?.message ||
          parsedContent?.message ||
          parsedContent?.error;

        if (providerErrorMessage) {
          throw new HttpException(
            providerErrorMessage,
            HttpStatus.BAD_GATEWAY,
          );
        }
      } catch (error) {
        if (error instanceof HttpException) throw error;
      }

      return content;
    };

    const getExceptionMessage = (error: HttpException) => {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object') {
        const message = (response as any).message;
        return Array.isArray(message) ? message.join(', ') : message;
      }
      return '';
    };

    const isRetryableFormatError = (error: unknown) => {
      if (!(error instanceof HttpException)) return false;

      const status = error.getStatus();
      const message = String(getExceptionMessage(error) || '').toLowerCase();

      if (message.includes('provider returned error')) {
        return true;
      }

      return ![
        HttpStatus.UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
        HttpStatus.PAYMENT_REQUIRED,
        HttpStatus.TOO_MANY_REQUESTS,
      ].includes(status);
    };

    const isOpenRouterFreeModel =
      String(model || '').trim().toLowerCase() === 'openrouter/free';
    const formatsToTry = isOpenRouterFreeModel
      ? [undefined, undefined, undefined]
      : responseFormat
        ? [responseFormat, { type: 'json_object' }, undefined]
        : [{ type: 'json_object' }, undefined];

    try {
      let lastError: unknown = null;

      for (let index = 0; index < formatsToTry.length; index += 1) {
        const format = formatsToTry[index];

        try {
          return await requestCompletion(format);
        } catch (error) {
          lastError = error;

          if (!isRetryableFormatError(error) || index === formatsToTry.length - 1) {
            throw error;
          }

          console.warn(
            `AI provider rejected response format attempt ${index + 1}. Retrying with ${
              formatsToTry[index + 1]?.type || 'no response_format'
            }.`,
          );
        }
      }

      throw lastError;
    } catch (error) {
      console.error('AI Service Error:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error instanceof Error
          ? `Unable to connect to the AI service: ${error.message}`
          : 'An unexpected error occurred while connecting to the AI service.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
