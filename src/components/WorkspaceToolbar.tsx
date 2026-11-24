import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  HeartPulse,
  LocateFixed,
  Map as MapIcon,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { useLanguage } from '../i18n';
import type { AppView } from '../types';
import { CitySearchInput, type SearchSuggestion } from './CitySearchInput';

interface WorkspaceToolbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onSelectLocation: (loc: SearchSuggestion) => void;
  onDetectLocation: () => void;
  locating: boolean;
  locationError: string | null;
  locationNotice?: string | null;
  onDismissLocationNotice?: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  alertThreshold: number;
  currentCityName?: string;
  currentAqi?: number;
}

const WORKSPACE_TABS: Array<{ id: AppView; label: string; icon: typeof Activity }> = [
  { id: 'dashboard', label: 'Live AQI', icon: Activity },
  { id: 'explore', label: 'City Map', icon: MapIcon },
  { id: 'analytics', label: 'Analytics & Compare', icon: BarChart3 },
  { id: 'assistant', label: 'BreatheAI', icon: Bot },
  { id: 'health', label: 'Health Guide', icon: HeartPulse },
];

export function WorkspaceToolbar({
  activeView,
  onNavigate,
  onSelectLocation,
  onDetectLocation,
  locating,
  locationError,
  locationNotice,
  onDismissLocationNotice,
  darkMode,
  onToggleTheme,
  alertThreshold,
  currentCityName,
  currentAqi,
}: WorkspaceToolbarProps) {
  const { t } = useLanguage();
  const alertTriggered =
    typeof currentAqi === 'number' && currentAqi >= alertThreshold && Boolean(currentCityName);

  const workspaceTabs: Array<{ id: AppView; label: string; icon: typeof Activity }> = [
    { id: 'dashboard', label: t.tabLiveAqi, icon: Activity },
    { id: 'explore', label: t.tabCityMap, icon: MapIcon },
    { id: 'analytics', label: t.tabAnalytics, icon: BarChart3 },
    { id: 'assistant', label: t.tabBreatheAi, icon: Bot },
    { id: 'health', label: t.tabHealthGuide, icon: HeartPulse },
  ];

  return (
    <div className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Sub-navigation workspace tabs */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            {workspaceTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onNavigate(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-[#14532D] shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search + Detect Location + Theme Toggle */}
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 sm:w-72 sm:flex-none">
              <CitySearchInput
                compact
                placeholder={t.switchCityPlaceholder}
                submitLabel={t.go}
                onSelectLocation={onSelectLocation}
              />
            </div>

            <button
              type="button"
              onClick={onDetectLocation}
              disabled={locating}
              aria-label="Detect my current location"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LocateFixed className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
              {locating ? t.locating : t.nearMe}
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={darkMode ? t.switchToLight : t.switchToDark}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {locationError && (
          <p role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-400">
            {locationError}
          </p>
        )}

        {locationNotice && (
          <div
            role="status"
            className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-sky-500/30 bg-sky-50 px-3.5 py-2 text-xs text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-200"
          >
            <div className="flex items-center gap-2 font-medium">
              <LocateFixed className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              <span>{locationNotice}</span>
            </div>
            {onDismissLocationNotice && (
              <button
                type="button"
                onClick={onDismissLocationNotice}
                aria-label={t.dismissNotice}
                className="rounded-lg p-1 text-sky-700 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-900/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {alertTriggered && (
          <div
            role="status"
            className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-50 px-3.5 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>
                {t.airQualityAlertPrefix} {currentCityName} AQI <strong className="font-mono tabular-nums">{currentAqi}</strong> ({t.exceedingThresholdSuffix}: {alertThreshold}).
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('health')}
              className="font-semibold underline underline-offset-2 hover:opacity-80 whitespace-nowrap"
            >
              {t.viewPrecautions}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
