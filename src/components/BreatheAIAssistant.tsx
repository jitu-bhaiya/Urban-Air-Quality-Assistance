import { useEffect, useRef, useState } from 'react';
import { Bot, RotateCcw, Send, ShieldAlert, User } from 'lucide-react';
import { translateAQIStatus, useLanguage } from '../i18n';
import type { AirQualityPayload, ChatMessage, DemographicGroup } from '../types';
import { getAQICategory } from '../utils/aqi';

interface BreatheAIAssistantProps {
  currentCityData: AirQualityPayload | null;
  sensitiveGroup: DemographicGroup;
}

export function BreatheAIAssistant({
  currentCityData,
  sensitiveGroup,
}: BreatheAIAssistantProps) {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading, error]);

  const welcomeText = currentCityData
    ? lang === 'hi'
      ? `नमस्ते! मैं BreatheAI हूँ। मैं ${currentCityData.city.name} के वर्तमान AQI (${currentCityData.aqi} · ${translateAQIStatus(currentCityData.status, lang)}) को समझने और सुरक्षा उपाय बताने में आपकी मदद कर सकता हूँ। नीचे दिया कोई प्रश्न चुनें या अपना सवाल पूछें।`
      : `Hello! I'm BreatheAI. I can help you interpret ${currentCityData.city.name}'s current AQI (${currentCityData.aqi} · ${currentCityData.status}) and share practical exposure precautions. Ask a question or pick a quick prompt below.`
    : lang === 'hi'
      ? 'नमस्ते! मैं BreatheAI हूँ। कोई शहर चुनें या शहरी वायु गुणवत्ता, PM2.5 से बचाव और बाहरी गतिविधि के समय के बारे में कोई भी सवाल पूछें।'
      : "Hello! I'm BreatheAI. Select a city or ask any question about urban air quality, PM2.5 protection, and outdoor timing.";

  const requestReply = async (trimmed: string, priorHistory: ChatMessage[]) => {
    setError(null);
    setLastFailedPrompt(null);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35_000);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          language: lang,
          history: priorHistory.slice(-6).map((m) => ({
            role: m.role,
            content: m.id === 'welcome' ? welcomeText : m.content,
          })),
          context: currentCityData
            ? {
                cityName: currentCityData.city.name,
                state: currentCityData.city.state,
                aqi: currentCityData.aqi,
                status: currentCityData.status,
                dominantPollutant: currentCityData.dominantPollutant,
                pm25: currentCityData.pollutants.pm25,
                pm10: currentCityData.pollutants.pm10,
                no2: currentCityData.pollutants.no2,
                o3: currentCityData.pollutants.o3,
                temperature: currentCityData.weather.temperature,
                humidity: currentCityData.weather.humidity,
                windSpeed: currentCityData.weather.windSpeed,
                dataMode: currentCityData.dataMode,
                sensitiveGroup,
              }
            : undefined,
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        throw new Error(
          data.error ||
            (lang === 'hi'
              ? 'BreatheAI अभी उपलब्ध नहीं है। कृपया पुनः प्रयास करें।'
              : 'BreatheAI is temporarily unavailable. Please try again.')
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply!,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setLastFailedPrompt(trimmed);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      setError(
        isAbort
          ? lang === 'hi'
            ? 'अनुरोध का समय समाप्त हो गया। कृपया पुनः प्रयास करें।'
            : 'The request timed out. Please try again.'
          : err instanceof Error
            ? err.message
            : lang === 'hi'
              ? 'BreatheAI से संपर्क नहीं हो सका।'
              : 'Unable to reach BreatheAI.'
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const priorHistory = messages;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      cityContext: currentCityData?.city.name,
      aqiContext: currentCityData?.aqi,
    };

    setMessages([...priorHistory, userMsg]);
    setInput('');
    await requestReply(trimmed, priorHistory);
  };

  const handleRetry = () => {
    if (!lastFailedPrompt || loading) return;
    const priorHistory = messages.slice(0, -1);
    void requestReply(lastFailedPrompt, priorHistory);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const aqiMeta = currentCityData ? getAQICategory(currentCityData.aqi, lang) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t.aiTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.aiSubtitle}
          </p>
        </div>

        {currentCityData && aqiMeta && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-slate-500 dark:text-slate-400">{t.activeContext}</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {currentCityData.city.name}
            </span>
            <span aria-hidden="true">·</span>
            <span className={`font-mono font-bold tabular-nums ${aqiMeta.textClass}`}>
              AQI {currentCityData.aqi} ({translateAQIStatus(currentCityData.status, lang)})
            </span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <span>
          <strong>{t.aiDisclaimerStrong}</strong> {t.aiDisclaimerText}
        </span>
      </div>

      {/* Chat Shell */}
      <div className="mt-6 flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Messages */}
        <div
          ref={scrollContainerRef}
          aria-live="polite"
          className="flex h-[420px] flex-col gap-4 overflow-y-auto p-5 sm:p-6"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const displayText = msg.id === 'welcome' ? welcomeText : msg.content;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    isUser
                      ? 'bg-[#14532D] text-white dark:bg-emerald-500 dark:text-slate-950'
                      : 'bg-slate-100 text-[#14532D] dark:bg-slate-800 dark:text-emerald-400'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-[#14532D] text-white dark:bg-emerald-600 dark:text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'
                  }`}
                >
                  {displayText}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#14532D] dark:bg-slate-800 dark:text-emerald-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                {t.analyzingPrefix} {currentCityData?.city.name || 'AQI'} {t.analyzingSuffix}
              </div>
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mx-5 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <span>{error}</span>
            {lastFailedPrompt && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                {t.retryFetch}
              </button>
            )}
          </div>
        )}

        {/* Quick Prompts */}
        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t.suggestedQuestions}
          </div>
          <div className="flex flex-wrap gap-2">
            {t.aiQuickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(q)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-[#14532D] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-emerald-500/60 dark:hover:text-emerald-300"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-slate-200 p-4 dark:border-slate-800"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${t.aiInputPlaceholderPrefix} ${currentCityData?.city.name || 'AQI'}...`}
            aria-label={t.aiTitle}
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t.aiAskBtn}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#14532D] px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {t.aiAskBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
