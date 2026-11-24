import { translateAQIStatus, useLanguage } from '../i18n';
import { getAQICategory } from '../utils/aqi';

const AQI_BANDS = [25, 75, 150, 250, 350, 450];

export function AboutMethodology() {
  const { lang, t } = useLanguage();

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          {t.aboutTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
          {t.aboutSubtitle}
        </p>
      </div>

      {/* Data Transparency */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
          {t.provenanceTitle}
        </h2>
        <div className="mt-4 divide-y divide-slate-100 text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300">
          <div className="py-3.5">
            <strong className="text-slate-950 dark:text-white">{t.prov1Title}</strong>{' '}
            {t.prov1Desc}
          </div>
          <div className="py-3.5">
            <strong className="text-slate-950 dark:text-white">{t.prov2Title}</strong>{' '}
            {t.prov2Desc}
          </div>
          <div className="py-3.5">
            <strong className="text-slate-950 dark:text-white">{t.prov3Title}</strong>{' '}
            {t.prov3Desc}
          </div>
        </div>
      </section>

      {/* Indian NAQI Scale */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
          {t.naqiScaleTitle}
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          {t.naqiScaleDesc}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AQI_BANDS.map((sample) => {
            const cat = getAQICategory(sample, lang);
            return (
              <div
                key={cat.label}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <span
                  aria-hidden="true"
                  className={`mt-1 h-3 w-3 shrink-0 rounded-xs ${cat.dotClass}`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-slate-950 dark:text-white">
                      {translateAQIStatus(cat.label, lang)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      ({cat.range})
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {cat.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <strong className="text-slate-900 dark:text-slate-200">{t.privacyTitle}</strong>{' '}
        {t.privacyDesc}
      </section>
    </div>
  );
}
