import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const PRIMARY_CHAT_MODEL = 'gemini-4-hydrogen';
export const FALLBACK_CHAT_MODEL = 'gemini-3.1-flash-lite';

export interface GenerateChatClient {
  generateContent: (params: {
    model: string;
    contents: string;
    config: {
      systemInstruction: string;
      thinkingConfig: { thinkingLevel: ThinkingLevel };
    };
  }) => Promise<{ text?: string }>;
}

export interface GenerateChatOptions {
  apiKey: string;
  prompt: string;
  systemInstruction: string;
  clientOverride?: GenerateChatClient;
  sleepFn?: (ms: number) => Promise<void>;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableGeminiError(error: unknown): boolean {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: unknown }).status)
      : NaN;

  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return false;
  }
  if (status === 429 || (status >= 500 && status <= 599)) {
    return true;
  }

  const msg = error instanceof Error ? error.message : String(error ?? '');
  if (
    /API_KEY_INVALID|PERMISSION_DENIED|INVALID_ARGUMENT|NOT_FOUND|"code":400|"code":401|"code":403|"code":404/i.test(
      msg
    )
  ) {
    return false;
  }

  return /503|502|500|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|timed out|timeout|abort|ETIMEDOUT|ECONNRESET|fetch failed/i.test(
    msg
  );
}

export function formatGeminiErrorMessage(
  error: unknown,
  language: 'en' | 'hi' = 'en'
): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');

  if (/API_KEY_INVALID|PERMISSION_DENIED|403|401/i.test(raw)) {
    return language === 'hi'
      ? 'BreatheAI सेवा कुंजी मान्य नहीं है। कृपया Settings > Secrets में GEMINI_API_KEY जांचें।'
      : 'BreatheAI could not authenticate with the Gemini API. Please check GEMINI_API_KEY in Settings > Secrets.';
  }

  if (/503|UNAVAILABLE|high demand|overloaded|timeout|timed out|abort/i.test(raw)) {
    return language === 'hi'
      ? 'BreatheAI पर अभी अधिक ट्रैफ़िक या नेटवर्क देरी है। कृपया कुछ सेकंड बाद पुनः प्रयास करें।'
      : 'BreatheAI is experiencing temporary high demand or delay. Please try sending your question again in a moment.';
  }

  if (/429|RESOURCE_EXHAUSTED|quota/i.test(raw)) {
    return language === 'hi'
      ? 'BreatheAI की वर्तमान दर सीमा पूरी हो गई है। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
      : 'BreatheAI rate limit reached temporarily. Please wait a moment and try again.';
  }

  return language === 'hi'
    ? 'BreatheAI अभी उत्तर नहीं दे सका। कृपया पुनः प्रयास करें।'
    : 'BreatheAI could not complete your request right now. Please try again.';
}

export async function generateGeminiChatReply({
  apiKey,
  prompt,
  systemInstruction,
  clientOverride,
  sleepFn = defaultSleep,
}: GenerateChatOptions): Promise<{ reply: string; modelUsed: string }> {
  const client: GenerateChatClient =
    clientOverride ??
    (() => {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          timeout: 12000,
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      return {
        generateContent: (params) => ai.models.generateContent(params),
      };
    })();

  const modelsToTry = [PRIMARY_CHAT_MODEL, FALLBACK_CHAT_MODEL];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await client.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

        const text = response.text?.trim();
        if (text) {
          return { reply: text, modelUsed: model };
        }
        lastError = new Error(`Empty response from ${model}`);
      } catch (err) {
        lastError = err;
        if (!isRetryableGeminiError(err)) {
          throw err;
        }
      }

      if (attempt === 0) {
        await sleepFn(350);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to reach BreatheAI service.');
}
