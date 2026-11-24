import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  Bookmark,
  CheckCircle2,
  Clock,
  LogOut,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { translateAQIStatus, useLanguage } from '../i18n';
import type { CitySummary, DemographicGroup, UserPreferences, UserProfile } from '../types';
import {
  buildFavoriteAlertBody,
  findExceededFavoriteCities,
  getAQICategory,
} from '../utils/aqi';

interface ProfilePanelProps {
  open: boolean;
  user: UserProfile | null;
  cities: CitySummary[];
  onClose: () => void;
  onSelectCityId: (cityId: string) => void;
  onToggleFavorite: (cityId: string) => void;
  onClearHistory: () => void;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onSendTestAlert: (message: string) => void;
  onSignOut: () => void;
}

type BrowserPermState = NotificationPermission | 'unsupported';

const THRESHOLD_PRESETS = [100, 150, 200, 300];

export function ProfilePanel({
  open,
  user,
  cities,
  onClose,
  onSelectCityId,
  onToggleFavorite,
  onClearHistory,
  onUpdatePreferences,
  onSendTestAlert,
  onSignOut,
}: ProfilePanelProps) {
  const { lang, t } = useLanguage();
  const [permState, setPermState] = useState<BrowserPermState>('unsupported');
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermState(Notification.permission);
    } else {
      setPermState('unsupported');
    }
  }, [open]);

  if (!open || !user) return null;

  const favoriteCityObjects = user.favorites
    .map((id) => cities.find((c) => c.id === id))
    .filter((c): c is CitySummary => Boolean(c));

  const exceededFavorites = findExceededFavoriteCities(
    cities,
    user.favorites,
    user.preferences.thresholdAqi
  );
  const alertSummaryText = buildFavoriteAlertBody(
    exceededFavorites,
    user.preferences.thresholdAqi,
    lang
  );

  const handleToggleBrowserAlerts = async () => {
    const nextEnabled = !user.preferences.browserAlerts;
    setTestFeedback(null);

    if (nextEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      let currentPerm = Notification.permission;
      if (currentPerm === 'default') {
        try {
          currentPerm = await Notification.requestPermission();
        } catch {
          currentPerm = Notification.permission;
        }
      }
      setPermState(currentPerm);
    }

    onUpdatePreferences({ browserAlerts: nextEnabled });
  };

  const handleTestNotification = async () => {
    const body =
      exceededFavorites.length > 0
        ? alertSummaryText
        : lang === 'hi'
          ? `नमूना अलर्ट: नई दिल्ली (AQI 233) आपकी ${user.preferences.thresholdAqi} AQI सीमा से ऊपर है।`
          : `Sample alert: New Delhi (AQI 233) exceeded your ${user.preferences.thresholdAqi} AQI threshold.`;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      let perm = Notification.permission;
      if (perm === 'default') {
        try {
          perm = await Notification.requestPermission();
        } catch {
          perm = Notification.permission;
        }
      }
      setPermState(perm);

      if (perm === 'granted') {
        try {
          new Notification(`${t.brand} · ${t.favoriteAlertTitle}`, {
            body,
            tag: 'breathewell-test-alert',
          });
          setTestFeedback(t.testDispatched);
          onSendTestAlert(body);
          return;
        } catch {
          // Fall through to in-app alert banner
        }
      }
    }

    onSendTestAlert(body);
    setTestFeedback(permState === 'denied' ? t.testBlockedPreview : t.testInAppPreview);
  };

  const permissionLabel =
    permState === 'granted'
      ? t.permGranted
      : permState === 'denied'
        ? t.permDenied
        : permState === 'default'
          ? t.permDefault
          : t.permUnsupported;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-panel-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs"
    >
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#14532D] dark:bg-emerald-950 dark:text-emerald-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 id="profile-panel-title" className="font-display text-base font-bold text-slate-950 dark:text-white">
                {user.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user.email} {user.isDemo ? `· ${t.demoProfileTag}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeMenu}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notification Settings */}
        <section aria-labelledby="notification-settings-heading" className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            <span id="notification-settings-heading">{t.notificationSettings}</span>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            {/* Opt-in Switch */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.browserAlertsTitle}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t.browserAlertsDesc}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {permissionLabel}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={user.preferences.browserAlerts}
                aria-label={t.browserAlertsTitle}
                onClick={handleToggleBrowserAlerts}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  user.preferences.browserAlerts
                    ? 'bg-[#14532D] dark:bg-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    user.preferences.browserAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Threshold Slider & Quick Presets */}
            <div className="border-t border-slate-100 pt-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>{t.personalThreshold}</span>
                <span className="font-mono font-bold text-[#14532D] tabular-nums dark:text-emerald-400">
                  {user.preferences.thresholdAqi} AQI
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={350}
                step={25}
                value={user.preferences.thresholdAqi}
                onChange={(e) => onUpdatePreferences({ thresholdAqi: Number(e.target.value) })}
                aria-label={t.personalThreshold}
                className="mt-2 w-full accent-[#14532D] dark:accent-emerald-500"
              />
              <div className="mt-2 flex items-center justify-between gap-1.5">
                {THRESHOLD_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onUpdatePreferences({ thresholdAqi: preset })}
                    className={`flex-1 rounded-lg border py-1 font-mono text-[11px] font-semibold tabular-nums transition-colors ${
                      user.preferences.thresholdAqi === preset
                        ? 'border-[#14532D] bg-emerald-50 text-[#14532D] dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Status of Favorite Cities vs Threshold */}
            <div className="border-t border-slate-100 pt-3.5 dark:border-slate-800">
              <div className="flex items-start gap-2 text-xs">
                {!user.preferences.browserAlerts ? (
                  <BellOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                ) : exceededFavorites.length > 0 ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                )}
                <span className="text-slate-600 dark:text-slate-300">
                  {user.preferences.browserAlerts
                    ? favoriteCityObjects.length === 0
                      ? t.saveCityMonitorPrompt
                      : alertSummaryText
                    : t.alertsPausedText}
                </span>
              </div>

              {user.preferences.browserAlerts && (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t.sendTestAlert}
                </button>
              )}

              {testFeedback && (
                <p role="status" className="mt-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  {testFeedback}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Health Profile */}
        <section className="mt-5">
          <label
            htmlFor="profile-group-select"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            {t.defaultHealthProfile}
          </label>
          <select
            id="profile-group-select"
            value={user.preferences.sensitiveGroup}
            onChange={(e) =>
              onUpdatePreferences({ sensitiveGroup: e.target.value as DemographicGroup })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="general">{t.groupLabels.general}</option>
            <option value="children">{t.groupLabels.children}</option>
            <option value="seniors">{t.groupLabels.seniors}</option>
            <option value="outdoor_workers">{t.groupLabels.outdoor_workers}</option>
            <option value="respiratory">{t.groupLabels.respiratory}</option>
          </select>
        </section>

        {/* Saved Favorite Cities */}
        <section className="mt-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
            {t.savedFavoriteCities} ({favoriteCityObjects.length})
          </div>

          {favoriteCityObjects.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {t.noSavedCities}
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {favoriteCityObjects.map((city) => {
                const cat = getAQICategory(city.aqi, lang);
                const overThreshold =
                  user.preferences.browserAlerts && city.aqi >= user.preferences.thresholdAqi;
                return (
                  <div key={city.id} className="flex items-center justify-between px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCityId(city.id);
                        onClose();
                      }}
                      className="text-left hover:opacity-80"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <span>{city.name}</span>
                        {overThreshold && (
                          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            · {t.abovePrefix} {user.preferences.thresholdAqi}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-medium tabular-nums ${cat.textClass}`}>
                        AQI {city.aqi} · {translateAQIStatus(city.status, lang)}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(city.id)}
                      aria-label={`Remove ${city.name}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Search History */}
        <section className="mt-6 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t.recentSearches}
            </div>
            {user.searchHistory.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-xs font-medium text-slate-500 hover:text-rose-600"
              >
                {t.clear}
              </button>
            )}
          </div>

          {user.searchHistory.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t.noRecentSearches}
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {user.searchHistory.map((item) => (
                <button
                  key={`${item.cityId}-${item.timestamp}`}
                  type="button"
                  onClick={() => {
                    onSelectCityId(item.cityId);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.cityName}, {item.state}
                  </span>
                  <span className="font-mono font-semibold text-slate-600 tabular-nums dark:text-slate-400">
                    {item.aqi} AQI
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            {t.signOut}
          </button>
        </div>
      </div>
    </div>
  );
}
