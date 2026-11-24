import { useState } from 'react';
import {
  Bookmark,
  Bot,
  Check,
  Download,
  Droplets,
  RefreshCw,
  Share2,
  Thermometer,
  Wind,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { translateAQIStatus, useLanguage } from '../i18n';
import type { AirQualityPayload, AppView, DemographicGroup } from '../types';
import {
  formatCSVReport,
  formatTextSummary,
  getAQICategory,
  getHealthRecommendations,
} from '../utils/aqi';

interface LiveDashboardProps {
  data: AirQualityPayload | null;
  loading: boolean;
  error: string | null;
  isFavorite: boolean;
  sensitiveGroup: DemographicGroup;
  onToggleFavorite: (cityId: string) => void;
  onRefresh: () => void;
  onNavigate: (view: AppView) => void;
}

export function LiveDashboard({
  data,
  loading,
  error,
  isFavorite,
  sensitiveGroup,
  onToggleFavorite,
  onRefresh,
  onNavigate,
}: LiveDashboardProps) {
  const { lang, t } = useLanguage();
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [chartMetric, setChartMetric] = useState<'aqi' | 'pm25'>('aqi');
  const [copiedShare, setCopiedShare] = useState(false);

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 dark:border-rose-900/50 dark:bg-slate-900">
          <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
            {t.unableToLoadAqi}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 dark:bg-emerald-500 dark:text-slate-950"
          >
            <RefreshCw className="h-4 w-4" />
            {t.retryFetch}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const category = getAQICategory(data.aqi, lang);
  const advice = getHealthRecommendations(data.aqi, sensitiveGroup, lang);
  const chartData =
    range === '24h' ? data.history.h24 : range === '7d' ? data.history.d7 : data.history.d30;

  // Circular gauge math
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0.03, data.aqi / 500));
  const strokeDashoffset = circumference * (1 - pct);

  const pollutantCards = [
    {
      label: 'PM2.5',
      fullName: t.pollutantNames['PM2.5'],
      value: data.pollutants.pm25,
      unit: 'µg/m³',
      limit: 60,
    },
    {
      label: 'PM10',
      fullName: t.pollutantNames.PM10,
      value: data.pollutants.pm10,
      unit: 'µg/m³',
      limit: 100,
    },
    {
      label: 'NO₂',
      fullName: t.pollutantNames['NO₂'],
      value: data.pollutants.no2,
      unit: 'µg/m³',
      limit: 80,
    },
    {
      label: 'SO₂',
      fullName: t.pollutantNames['SO₂'],
      value: data.pollutants.so2,
      unit: 'µg/m³',
      limit: 80,
    },
    {
      label: 'CO',
      fullName: t.pollutantNames.CO,
      value: data.pollutants.co,
      unit: 'mg/m³',
      limit: 2.0,
    },
    {
      label: 'O₃',
      fullName: t.pollutantNames['O₃'],
      value: data.pollutants.o3,
      unit: 'µg/m³',
      limit: 100,
    },
  ];

  const handleDownloadCsv = () => {
    const csv = formatCSVReport(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breathewell-${data.city.id}-aqi-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const summary = formatTextSummary(data);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
      }
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    }
  };

  const formattedUpdated = new Date(data.lastUpdated).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const dataModeLabel =
    data.dataMode === 'measured'
      ? t.liveMeasuredStation
      : data.dataMode === 'model'
        ? t.liveFreeApiAuto
        : t.simulatedRefData;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{data.city.state}, {data.city.country}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">{dataModeLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{t.updatedPrefix} {formattedUpdated}</span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            {data.city.name} {t.airQualityHeadingSuffix}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t.sourcePrefix} {data.dataSource}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(data.city.id)}
            aria-pressed={isFavorite}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isFavorite
                ? 'border-emerald-500/40 bg-emerald-50 text-[#14532D] dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
            {isFavorite ? t.savedCity : t.saveCity}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copiedShare ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
            {copiedShare ? t.copiedSummary : t.share}
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t.downloadCsv}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label={t.refreshAria}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60 whitespace-nowrap shrink-0 dark:bg-emerald-500 dark:text-slate-950"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t.refresh}
          </button>
        </div>
      </div>

      {/* Primary Gauge + Weather & Guidance Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Animated Circular AQI Gauge */}
        <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:gap-8 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative flex h-48 w-48 shrink-0 items-center justify-center">
            <svg className="h-48 w-48 -rotate-90" viewBox="0 0 180 180" aria-hidden="true">
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-100 dark:text-slate-800"
              />
              <motion.circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={category.hex}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">CPCB NAQI</span>
              <span
                data-testid="dashboard-aqi-value"
                className="mt-0.5 font-mono text-5xl font-bold tracking-tight text-slate-950 tabular-nums dark:text-white"
              >
                {data.aqi}
              </span>
              <span className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${category.textClass}`}>
                <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-xs ${category.dotClass}`} />
                {translateAQIStatus(data.status, lang)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex-1 sm:mt-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{t.bandPrefix} {category.range}</span>
              <span aria-hidden="true">·</span>
              <span>{t.dominantLabel}: <strong className="text-slate-800 dark:text-slate-200">{data.dominantPollutant}</strong></span>
              {typeof data.usAqi === 'number' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">US AQI: <strong className="text-slate-800 dark:text-slate-200">{data.usAqi}</strong></span>
                </>
              )}
              {typeof data.europeanAqi === 'number' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">EU AQI: <strong className="text-slate-800 dark:text-slate-200">{data.europeanAqi}</strong></span>
                </>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {category.summary}
            </p>

            {/* Weather Trio */}
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Thermometer className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  {t.tempLabel}
                </div>
                <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                  {data.weather.temperature !== null ? `${data.weather.temperature}°C` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Droplets className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
                  {t.humidityLabel}
                </div>
                <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                  {data.weather.humidity !== null ? `${data.weather.humidity}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Wind className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  {t.windLabel}
                </div>
                <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                  {data.weather.windSpeed !== null ? `${data.weather.windSpeed} km/h` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Health Recommendations Summary */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                {t.guidanceForPrefix} {advice.title}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('health')}
                className="text-xs font-semibold text-[#14532D] hover:underline whitespace-nowrap dark:text-emerald-400"
              >
                {t.allGroups}
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{advice.summary}</p>

            <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
              <div>
                <dt className="font-semibold text-slate-800 dark:text-slate-200">{t.outdoorActivity}</dt>
                <dd className="mt-0.5 text-slate-600 dark:text-slate-400">{advice.outdoorActivity}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800 dark:text-slate-200">{t.maskAndVentilation}</dt>
                <dd className="mt-0.5 text-slate-600 dark:text-slate-400">{advice.maskAndVentilation}</dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('assistant')}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-[#14532D] transition-colors hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            <Bot className="h-4 w-4" aria-hidden="true" />
            {t.askBreatheAiAbout} {data.city.name}
          </button>
        </div>
      </div>

      {/* 6 Pollutant Grid */}
      <section aria-labelledby="pollutants-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="pollutants-heading" className="font-display text-xl font-bold text-slate-950 dark:text-white">
            {t.pollutantConcentrations}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t.pollutantThresholdNote}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pollutantCards.map((p) => {
            const ratio = p.value !== null ? Math.min(100, Math.round((p.value / p.limit) * 100)) : 0;
            const elevated = p.value !== null && p.value > p.limit;
            return (
              <div
                key={p.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-base font-bold text-slate-950 dark:text-white">
                      {p.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.fullName}</div>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    {p.value !== null ? (
                      <>
                        <span className="text-2xl font-bold text-slate-950 dark:text-white">{p.value}</span>
                        <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">{p.unit}</span>
                      </>
                      ) : (
                      <span className="text-sm font-medium text-slate-400">{t.unavailable}</span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        elevated ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${p.value !== null ? Math.max(6, ratio) : 0}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                    <span>{t.referenceLimit} {p.limit} {p.unit}</span>
                    <span>{p.value !== null ? (elevated ? t.aboveLimit : t.withinLimit) : t.noSensorData}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Historical Chart */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              {t.historicalTrendTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {range === '30d' || data.historyMode === 'simulated'
                ? t.historicalSimulatedNote
                : t.historicalArchiveNote}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setChartMetric('aqi')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  chartMetric === 'aqi'
                    ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                AQI
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('pm25')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  chartMetric === 'pm25'
                    ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                PM2.5 (µg/m³)
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(['24h', '7d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
                    range === r
                      ? 'bg-[#14532D] text-white dark:bg-emerald-500 dark:text-slate-950'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {r === '24h' ? t.range24h : r === '7d' ? t.range7d : t.range30d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={category.hex} stopOpacity={0.32} />
                  <stop offset="95%" stopColor={category.hex} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                minTickGap={20}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#1E293B',
                  borderRadius: '12px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
                formatter={(val) => [
                  `${val} ${chartMetric === 'aqi' ? 'AQI' : 'µg/m³'}`,
                  chartMetric === 'aqi' ? 'NAQI' : 'PM2.5',
                ]}
              />
              <Area
                type="monotone"
                dataKey={chartMetric}
                stroke={category.hex}
                strokeWidth={2.5}
                fill="url(#aqiGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Nearby Monitoring Nodes */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              {t.stationsTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.stationsSubtitlePrefix} {data.city.name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-semibold text-[#14532D] hover:underline dark:text-emerald-400"
          >
            {t.viewOnInteractiveMap}
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {data.stations.map((station) => {
            const stMeta = station.aqi !== null ? getAQICategory(station.aqi, lang) : null;
            return (
              <div
                key={station.id}
                className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {station.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {station.area} · {station.status === 'measured' ? t.openAqMeasuredStation : station.status === 'model' ? t.gridModelNode : t.simulatedNode}
                  </div>
                </div>
                <div className="flex items-center gap-5 font-mono text-xs tabular-nums">
                  <span className="text-slate-600 dark:text-slate-300">
                    PM2.5: {station.pm25 !== null ? `${station.pm25} µg/m³` : t.unavailable}
                  </span>
                  {station.aqi !== null && stMeta ? (
                    <span className={`font-semibold ${stMeta.textClass}`}>
                      AQI {station.aqi} ({translateAQIStatus(stMeta.label, lang)})
                    </span>
                  ) : (
                    <span className="text-slate-400">{t.stationTelemetryActive}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
