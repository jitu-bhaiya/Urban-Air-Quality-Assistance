import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FALLBACK_CHAT_MODEL,
  PRIMARY_CHAT_MODEL,
  formatGeminiErrorMessage,
  generateGeminiChatReply,
  isRetryableGeminiError,
} from './geminiChat';

const noopSleep = async () => {};

test('isRetryableGeminiError distinguishes transient 503/429 from fatal 400/403', () => {
  assert.equal(
    isRetryableGeminiError(
      new Error('{"error":{"code":503,"message":"high demand","status":"UNAVAILABLE"}}')
    ),
    true
  );
  assert.equal(isRetryableGeminiError(new Error('429 RESOURCE_EXHAUSTED')), true);
  assert.equal(isRetryableGeminiError(new Error('400 API_KEY_INVALID')), false);
  assert.equal(isRetryableGeminiError(new Error('403 PERMISSION_DENIED')), false);
});

test('generateGeminiChatReply retries transient 503 on primary model and succeeds', async () => {
  const calls: string[] = [];
  let attempt = 0;

  const result = await generateGeminiChatReply({
    apiKey: 'test-key',
    prompt: 'Is it safe outside?',
    systemInstruction: 'Be helpful.',
    sleepFn: noopSleep,
    clientOverride: {
      async generateContent({ model }) {
        calls.push(model);
        attempt++;
        if (attempt === 1) {
          throw new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}');
        }
        return { text: 'Yes, AQI is satisfactory.' };
      },
    },
  });

  assert.equal(result.reply, 'Yes, AQI is satisfactory.');
  assert.equal(result.modelUsed, PRIMARY_CHAT_MODEL);
  assert.deepEqual(calls, [PRIMARY_CHAT_MODEL, PRIMARY_CHAT_MODEL]);
});

test('generateGeminiChatReply falls back to gemini-3.1-flash-lite if primary model stays 503', async () => {
  const calls: string[] = [];

  const result = await generateGeminiChatReply({
    apiKey: 'test-key',
    prompt: 'What mask should I wear?',
    systemInstruction: 'Be helpful.',
    sleepFn: noopSleep,
    clientOverride: {
      async generateContent({ model }) {
        calls.push(model);
        if (model === PRIMARY_CHAT_MODEL) {
          throw new Error('503 UNAVAILABLE');
        }
        return { text: 'Wear an N95 mask outdoors.' };
      },
    },
  });

  assert.equal(result.reply, 'Wear an N95 mask outdoors.');
  assert.equal(result.modelUsed, FALLBACK_CHAT_MODEL);
  assert.deepEqual(calls, [PRIMARY_CHAT_MODEL, PRIMARY_CHAT_MODEL, FALLBACK_CHAT_MODEL]);
});

test('generateGeminiChatReply fails fast on non-retryable auth errors', async () => {
  const calls: string[] = [];

  await assert.rejects(
    () =>
      generateGeminiChatReply({
        apiKey: 'bad-key',
        prompt: 'Hello',
        systemInstruction: 'Be helpful.',
        sleepFn: noopSleep,
        clientOverride: {
          async generateContent({ model }) {
            calls.push(model);
            throw new Error('400 API_KEY_INVALID');
          },
        },
      }),
    /API_KEY_INVALID/
  );

  assert.deepEqual(calls, [PRIMARY_CHAT_MODEL]);
});

test('formatGeminiErrorMessage translates raw upstream errors into Hindi and English', () => {
  const hiMsg = formatGeminiErrorMessage(new Error('503 UNAVAILABLE'), 'hi');
  const enMsg = formatGeminiErrorMessage(new Error('503 UNAVAILABLE'), 'en');
  assert.match(hiMsg, /ट्रैफ़िक/);
  assert.match(enMsg, /high demand/i);
});
