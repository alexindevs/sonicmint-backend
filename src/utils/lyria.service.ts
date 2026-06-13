import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface GenerateParams {
  prompt: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  instruments?: string[];
}

@Injectable()
export class LyriaService {
  private readonly logger = new Logger(LyriaService.name);
  private readonly ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = configService.get<string>('ai.geminiApiKey');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateTrack(params: GenerateParams): Promise<Buffer> {
    const prompt = this.buildPrompt(params);
    this.logger.log(`Calling Lyria Pro: "${prompt.slice(0, 80)}..."`);

    const response = await this.ai.models.generateContent({
      model: 'lyria-3-pro-preview',
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }

    throw new InternalServerErrorException('Lyria returned no audio data');
  }

  private buildPrompt(params: GenerateParams): string {
    const parts: string[] = [params.prompt];

    if (params.genre) parts.push(`Genre: ${params.genre}`);
    if (params.mood) parts.push(`Mood: ${params.mood}`);
    if (params.bpm) parts.push(`Tempo: ${params.bpm} BPM`);
    if (params.key) parts.push(`Key: ${params.key}`);
    if (params.instruments?.length) {
      parts.push(`Instruments: ${params.instruments.join(', ')}`);
    }

    parts.push('Instrumental only, no vocals.');

    return parts.join('. ');
  }
}
