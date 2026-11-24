import { Github, Globe, Languages, Mail, Moon, Sun, Wind } from 'lucide-react';
import { useLanguage } from '../i18n';
import type { AppView } from '../types';

interface FooterProps {
  onNavigate: (view: AppView) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export function Footer({ onNavigate, darkMode, onToggleTheme }: FooterProps) {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 text-lg font-bold text-[#14532D] dark:text-emerald-400">
              <Wind className="h-5 w-5" aria-hidden="true" />
              <span className="font-display">{t.brand}</span>
            </div>
            <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t.footerDesc}
            </p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
              {t.footerDisclaimer}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:col-span-7">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.platformHeading}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>
                  <button type="button" onClick={() => onNavigate('dashboard')} className="hover:text-[#14532D] dark:hover:text-emerald-400">
                    {t.liveAqiDashboardLink}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('explore')} className="hover:text-[#14532D] dark:hover:text-emerald-400">
                    {t.interactiveCityMapLink}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('analytics')} className="hover:text-[#14532D] dark:hover:text-emerald-400">
                    {t.trendsComparisonLink}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.guidanceHeading}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>
                  <button type="button" onClick={() => onNavigate('health')} className="hover:text-[#14532D] dark:hover:text-emerald-400">
                    {t.navHealthGuide}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('assistant')} className="hover:text-[#14532D] dark:hover:text-emerald-400">
                    {t.breatheAiAssistantLink}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('about')} className="hover:text-[#14532D] dark:hover:text-emerald-400">
                    {t.methodologySourcesLink}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.displayLinksHeading}
              </h3>
              <div className="mt-3 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={darkMode ? t.switchToLight : t.switchToDark}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
                  {darkMode ? t.lightMode : t.darkMode}
                </button>
                <button
                  type="button"
                  onClick={toggleLang}
                  aria-label={t.switchLangLabel}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <Languages className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  {lang === 'en' ? 'हिन्दी में देखें' : 'View in English'}
                </button>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    aria-label="Open-Meteo and OpenAQ data attribution"
                    className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <Globe className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('assistant')}
                    aria-label="Ask BreatheAI support"
                    className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    aria-label="View methodology documentation"
                    className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <Github className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center dark:border-slate-800 dark:text-slate-500">
          <span>{t.footerCopyright}</span>
          <span>{t.footerDataAttr}</span>
        </div>
      </div>
    </footer>
  );
}
