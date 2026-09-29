import { BadRequestException } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController organic report highlights', () => {
  const payload = {
    clientName: 'Test Client',
    instruction: 'Keep the tone warm.',
    platforms: [
      {
        platform: 'facebook',
        periods: [
          {
            label: 'August 2026',
            since: '2026-08-01',
            until: '2026-08-31',
            metrics: [
              { label: 'Total views', value: 2500 },
              { label: 'Private token', value: 123 },
            ],
          },
        ],
      },
    ],
  };

  it('uses the configured AI service with allowlisted source metrics', async () => {
    const generateCompletion = jest.fn().mockResolvedValue(JSON.stringify({
      points: [{ platform: 'facebook', text: 'Facebook recorded 2,500 total views in August.' }],
    }));
    const controller = new AiController({ generateCompletion } as unknown as AiService);

    await expect(controller.generateOrganicReportHighlights(payload)).resolves.toEqual({
      points: [{ platform: 'facebook', text: 'Facebook recorded 2,500 total views in August.' }],
      generatedByAi: true,
    });
    const prompt = generateCompletion.mock.calls[0][0] as string;
    expect(prompt).toContain('Test Client');
    expect(prompt).toContain('Keep the tone warm.');
    expect(prompt).toContain('"value":2500');
    expect(prompt).not.toContain('Private token');
  });

  it('rejects requests without usable organic metrics', async () => {
    const controller = new AiController({ generateCompletion: jest.fn() } as unknown as AiService);
    await expect(controller.generateOrganicReportHighlights({ platforms: [] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts AI bullet text when the model ignores the JSON schema', async () => {
    const controller = new AiController({
      generateCompletion: jest.fn().mockResolvedValue('Highlights:\n- Facebook recorded 2,500 total views in August.'),
    } as unknown as AiService);
    await expect(controller.generateOrganicReportHighlights(payload)).resolves.toEqual({
      points: [{ platform: 'facebook', text: 'Facebook recorded 2,500 total views in August.' }],
      generatedByAi: true,
    });
  });

  it('accepts alternate AI JSON fields', async () => {
    const controller = new AiController({
      generateCompletion: jest.fn().mockResolvedValue('```json\n{"highlights":[{"channel":"Facebook","insight":"Facebook recorded 2,500 total views in August."}]}\n```'),
    } as unknown as AiService);
    await expect(controller.generateOrganicReportHighlights(payload)).resolves.toEqual({
      points: [{ platform: 'facebook', text: 'Facebook recorded 2,500 total views in August.' }],
      generatedByAi: true,
    });
  });

  it('uses verified source metrics when the AI returns an empty list', async () => {
    const controller = new AiController({ generateCompletion: jest.fn().mockResolvedValue('{"points":[]}') } as unknown as AiService);
    await expect(controller.generateOrganicReportHighlights(payload)).resolves.toEqual({
      points: [{ platform: 'facebook', text: "Test Client's Facebook recorded 2,500 total views in August 2026." }],
      generatedByAi: false,
    });
  });
});
