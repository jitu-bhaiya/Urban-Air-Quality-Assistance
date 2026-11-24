import { useState } from 'react';
import {
  Activity,
  Baby,
  Briefcase,
  CheckCircle2,
  HeartHandshake,
  Shield,
  Users,
  Wind,
} from 'lucide-react';
import { translateAQIStatus, useLanguage } from '../i18n';
import type { AirQualityPayload, DemographicGroup } from '../types';
import { getAQICategory, getHealthRecommendations } from '../utils/aqi';

interface HealthGuideProps {
  currentCityData: AirQualityPayload | null;
  defaultGroup: DemographicGroup;
}

const GROUP_ICONS: Array<{ id: DemographicGroup; icon: typeof Users }> = [
  { id: 'general', icon: Users },
  { id: 'children', icon: Baby },
  { id: 'seniors', icon: HeartHandshake },
  { id: 'outdoor_workers', icon: Briefcase },
  { id: 'respiratory', icon: Activity },
];

export function HealthGuide({ currentCityData, defaultGroup }: HealthGuideProps) {
  const { lang, t } = useLanguage();
  const [selectedGroup, setSelectedGroup] = useState<DemographicGroup>(defaultGroup);
  const activeAqi = currentCityData?.aqi ?? 110;
  const aqiMeta = getAQICategory(activeAqi, lang);
  const translatedLabel = translateAQIStatus(aqiMeta.label, lang);
  const guidance = getHealthRecommendations(activeAqi, selectedGroup, lang);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t.healthTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.healthSubtitlePrefix}{' '}
            <strong className="text-slate-900 dark:text-slate-200">
              {currentCityData?.city.name || (lang === 'hi' ? 'चयनित शहर' : 'Current Selection')} (AQI {activeAqi} · {translatedLabel})
            </strong>
            .
          </p>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.healthDisclaimer}
        </p>
      </div>

      {/* Group Selector */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        {GROUP_ICONS.map((g) => {
          const Icon = g.icon;
          const active = selectedGroup === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGroup(g.id)}
              aria-pressed={active}
              className={`inline-flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#14532D] text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t.groupLabels[g.id]}
            </button>
          );
        })}
      </div>

      {/* Selected Profile Guidance */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center dark:border-slate-800">
          <div>
            <div className={`text-xs font-semibold ${aqiMeta.textClass}`}>
              {t.calibratedForPrefix} {translatedLabel} ({aqiMeta.range} AQI)
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-slate-950 dark:text-white">
              {guidance.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {guidance.summary}
            </p>
          </div>
          <div className="text-left font-mono sm:text-right tabular-nums">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t.referenceAqi}</div>
            <div className="text-4xl font-bold text-slate-950 dark:text-white">{activeAqi}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
              <Wind className="h-4 w-4 text-sky-500" aria-hidden="true" />
              {t.outdoorActivityGuidance}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {guidance.outdoorActivity}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              {t.maskIndoorVentilation}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {guidance.maskAndVentilation}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
              <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              {t.exerciseSuggestions}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {guidance.exerciseSuggestion}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
          <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
            {t.exposurePrecautions}
          </h3>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {guidance.precautions.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
