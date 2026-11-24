import { ArrowRight, Compass, HeartPulse, ShieldCheck, Sparkles, Wind } from 'lucide-react';
import { motion } from 'motion/react';
import { translateAQIStatus, useLanguage } from '../i18n';
import type { AppView, CitySummary } from '../types';
import { getAQICategory } from '../utils/aqi';
import { CitySearchInput, type SearchSuggestion } from './CitySearchInput';

interface LandingPageProps {
  cities: CitySummary[];
  previewCity: CitySummary | null;
  loadingCities: boolean;
  onSelectLocation: (loc: SearchSuggestion) => void;
  onSelectCityId: (cityId: string) => void;
  onNavigate: (view: AppView) => void;
}

export function LandingPage({
  cities,
  previewCity,
  loadingCities,
  onSelectLocation,
  onSelectCityId,
  onNavigate,
}: LandingPageProps) {
  const { lang, t } = useLanguage();
  const featuredCities = cities.filter((c) => c.featured).slice(0, 6);
  const previewMeta = previewCity ? getAQICategory(previewCity.aqi, lang) : null;

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-[#F8FAFC] via-emerald-50/35 to-[#F8FAFC] py-12 lg:py-20 dark:border-slate-800/80 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-950">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
          {/* Left Hero Copy + Search */}
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
              {t.heroEyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950 text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] dark:text-white">
              {t.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              {t.heroSubtitle}
            </p>

            <div className="mt-7 max-w-xl">
              <CitySearchInput
                placeholder={t.searchCityPlaceholder}
                submitLabel={t.checkAirQuality}
                onSelectLocation={onSelectLocation}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {t.exploreDashboard}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('assistant')}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[#14532D] transition-colors hover:bg-emerald-50 whitespace-nowrap shrink-0 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {t.askBreatheAi}
              </button>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{t.quickJump}</span>
              {['new-delhi', 'mumbai', 'bengaluru', 'kochi'].map((id) => {
                const match = cities.find((c) => c.id === id);
                if (!match) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectCityId(id)}
                    className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-[#14532D] hover:decoration-[#14532D] dark:text-slate-300 dark:decoration-slate-700 dark:hover:text-emerald-400"
                  >
                    {match.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Hero Atmospheric Image + Live AQI Preview Card */}
          <div className="relative flex min-h-[360px] flex-col justify-end overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 lg:col-span-6 lg:min-h-[460px] dark:border-slate-800">
            <img
              src="/src/assets/images/hero_urban_canopy_1795362235030.jpg"
              alt="Sunlit urban skyline framed by green park trees under clear blue sky"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-slate-950/10"
            />

            {/* Live AQI Preview Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 m-4 rounded-2xl border border-white/20 bg-white/88 p-5 backdrop-blur-md sm:m-6 dark:border-slate-700/80 dark:bg-slate-900/88"
            >
              {previewCity && previewMeta ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span className="whitespace-nowrap">{previewCity.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">{previewCity.state}</span>
                      <span aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">
                        {previewCity.dataMode === 'simulated' ? t.simulatedRef : t.liveFreeApi}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-3">
                      <span className="font-mono text-4xl font-bold tracking-tight text-slate-950 tabular-nums dark:text-white">
                        {previewCity.aqi}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 whitespace-nowrap dark:text-slate-100">
                        <span
                          aria-hidden="true"
                          className={`inline-block h-2.5 w-2.5 rounded-xs ${previewMeta.dotClass}`}
                        />
                        {translateAQIStatus(previewCity.status, lang)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 border-t border-slate-200/80 pt-3 sm:justify-end sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0 dark:border-slate-700">
                    <div className="whitespace-nowrap">
                      <div className="text-xs text-slate-500 dark:text-slate-400">PM2.5</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                        {previewCity.pm25 ?? '--'} <span className="text-[11px] font-normal text-slate-500">µg/m³</span>
                      </div>
                    </div>
                    <div className="whitespace-nowrap">
                      <div className="text-xs text-slate-500 dark:text-slate-400">PM10</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                        {previewCity.pm10 ?? '--'} <span className="text-[11px] font-normal text-slate-500">µg/m³</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectCityId(previewCity.id)}
                      className="rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0 dark:bg-emerald-500 dark:text-slate-950"
                    >
                      {t.inspect}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-16 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800" />
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Indian Cities */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
              {t.featuredCitiesTitle}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              {t.featuredCitiesSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#14532D] hover:underline whitespace-nowrap shrink-0 dark:text-emerald-400"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            {t.openInteractiveMap}
          </button>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadingCities && featuredCities.length === 0
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              ))
            : featuredCities.map((city) => {
                const cat = getAQICategory(city.aqi, lang);
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => onSelectCityId(city.id)}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-400/70 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-bold text-slate-950 group-hover:text-[#14532D] dark:text-white dark:group-hover:text-emerald-400">
                          {city.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {city.state} · {t.dominantLabel}: {city.dominantPollutant}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold text-slate-950 tabular-nums dark:text-white">
                          {city.aqi}
                        </div>
                        <div className={`flex items-center justify-end gap-1.5 text-xs font-semibold ${cat.textClass}`}>
                          <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-xs ${cat.dotClass}`} />
                          {translateAQIStatus(city.status, lang)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600 tabular-nums dark:border-slate-800 dark:text-slate-300">
                      <span>PM2.5: {city.pm25 ?? '--'} µg/m³</span>
                      <span>PM10: {city.pm10 ?? '--'} µg/m³</span>
                      <span>{city.temperature ?? '--'}°C</span>
                    </div>
                  </button>
                );
              })}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-slate-200/80 bg-white py-14 dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
              <img
                src="/src/assets/images/monitoring_station_sensor_1795362235405.jpg"
                alt="Urban air quality monitoring station kiosk in a sunlit civic plaza"
                referrerPolicy="no-referrer"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
              {t.howItWorksTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t.howItWorksSubtitle}
            </p>

            <div className="mt-8 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              <div className="py-5">
                <h3 className="font-display text-base font-semibold text-slate-950 dark:text-white">
                  {t.step1Title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {t.step1Desc}
                </p>
              </div>
              <div className="py-5">
                <h3 className="font-display text-base font-semibold text-slate-950 dark:text-white">
                  {t.step2Title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {t.step2Desc}
                </p>
              </div>
              <div className="py-5">
                <h3 className="font-display text-base font-semibold text-slate-950 dark:text-white">
                  {t.step3Title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {t.step3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Health Awareness Section */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="lg:col-span-7">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
              {t.healthAwareTitle}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t.healthAwareDesc}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Wind className="h-4 w-4 text-sky-500" aria-hidden="true" />
                  {t.middayVentTitle}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.middayVentDesc}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  {t.filtrationTitle}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.filtrationDesc}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <HeartPulse className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  {t.sensitiveTitle}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.sensitiveDesc}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('health')}
                className="rounded-xl bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                {t.exploreHealthGuide}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t.compareIndianCities}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <img
                src="/src/assets/images/health_outdoor_park_1795362235037.jpg"
                alt="Residents walking and jogging along a green tree-lined urban park trail"
                referrerPolicy="no-referrer"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
