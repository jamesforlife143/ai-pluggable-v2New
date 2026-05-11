import { Injectable } from '@angular/core';

import {
  EmotionType,
  EMOTIONS
} from './emotion.model';

@Injectable({
  providedIn: 'root'
})
export class EmotionService {
  // Ollama local endpoint (OpenAI-compatible)
  private endpoint = 'http://localhost:11434/v1'; // note: /v1

  // Ollama model name (see suggestions below)
  private model = 'llama3.2'; // or 'phi3:mini', 'llama3.2', etc.

  // Azure props no longer needed, but you can keep them if you still use Azure elsewhere
  private apiVersion = '';
  private apiKey = '';

  private readonly batchSize = 20;

  async analyze(text: string): Promise<EmotionType[]> {
    text = text.replace(/\s+/g, ' ').trim();

    const sentences =
      text.match(/[^.!?]+(?:[.!?]+|$)/g)?.map(s => s.trim()) || [text];

    return this.analyzeSentences(sentences);
  }

  async analyzeSentences(
    sentences: string[]
  ): Promise<EmotionType[]> {

    const emotions: EmotionType[] = [];

    for (
      let i = 0;
      i < sentences.length;
      i += this.batchSize
    ) {

      const batch =
        sentences.slice(
          i,
          i + this.batchSize
        );

      const batchEmotions =
        await this.analyzeBatch(batch);

      emotions.push(
        ...batchEmotions
      );
    }

    return emotions;
  }

  private async analyzeBatch(
    sentences: string[]
  ): Promise<EmotionType[]> {

    try {
      // OpenAI-compatible chat completions URL for Ollama
      const url = `${this.endpoint}/chat/completions`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ollama’s OpenAI-compatible endpoint ignores api-key, but some clients require it
          'Authorization': 'Bearer ollama'
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          top_p: 0,
          max_tokens:
            Math.max(
              120,
              sentences.length * 8
            ),
          messages: [
            {
              role: 'system',
//               content: `
// You are an emotion classifier.

// Allowed labels:
// - EXPLAIN
// - APPROVE
// - ATTENTION

// Rules:
// - Return ONLY valid JSON array
// - No markdown
// - No explanation
// - Array length MUST match sentence count
// `

content: `
You are an intelligent conversational
emotion classifier for an AI avatar.

Allowed labels:
- EXPLAIN
- APPROVE
- ATTENTION

Behavior Rules:

1. EXPLAIN
Use for:
- storytelling
- neutral explanations
- descriptions
- narration
- walkthroughs

2. APPROVE
Use for:
- positive emotions
- excitement
- appreciation
- encouragement
- success
- humor
- welcoming tone

3. ATTENTION
Use for:
- warnings
- serious moments
- important statements
- emotional emphasis
- dramatic moments
- urgency

IMPORTANT:
- Avoid repeating the same emotion
for too many consecutive sentences.
- Add natural conversational variation.
- If tone slightly changes,
change emotion too.
- Output ONLY JSON array.
- No markdown.
- Array count MUST match
sentence count exactly.
`
            },
            {
              role: 'user',
              content: sentences
                .map((sentence, index) =>
                  `${index + 1}. ${sentence}`
                )
                .join('\n')
            }
          ]
        })
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Emotion API Error:', error);
        return this.fallback(sentences);
      }

      const data = await res.json();

      const raw = data?.choices?.[0]?.message?.content?.trim() ?? '';

      console.log('Emotion RAW:', raw);

      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) {
        return this.fallback(sentences);
      }

      const parsed = JSON.parse(match[0]);

      return sentences.map((_, i): EmotionType => {
        const value = String(parsed[i] || '')
          .trim()
          .toUpperCase();

        if (EMOTIONS.includes(value as EmotionType)) {
          return value as EmotionType;
        }
        return 'EXPLAIN';
      });
    } catch (err) {
      console.error('Emotion API Failed:', err);
      return this.fallback(sentences);
    }
  }

  private fallback(sentences: string[]): EmotionType[] {
    return sentences.map((s): EmotionType => {
      if (/great|awesome|excellent|good|well done/i.test(s)) {
        return 'APPROVE';
      }
      if (/important|attention|warning|critical|note/i.test(s)) {
        return 'ATTENTION';
      }
      return 'EXPLAIN';
    });
  }
}
