import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { translateAQIStatus, useLanguage } from '../i18n';
import type { AirQualityPayload, CitySummary } from '../types';
import { getAQICategory } from '../utils/aqi';

interface AnalyticsCompareProps {
  cities: CitySummary[];
  onSelectCityId: (cityId: string) => void;
}

export function AnalyticsCompare({ cities, onSelectCityId }: AnalyticsCompareProps) {
  const { lang, t } = useLanguage();
  const [cityAId, setCityAId] = useState<string>('new-delhi');
  const [cityBId, setCityBId] = useState<string>('bengaluru');
  const [cityAData, setCityAData] = useState<AirQualityPayload | null>(null);
  const [cityBData, setCityBData] = useState<AirQualityPayload | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/air-quality?cityId=${encodeURIComponent(cityAId)}`).then((r) => r.json()),
      fetch(`/api/air-quality?cityId=${encodeURIComponent(cityBId)}`).then((r) => r.json()),
    ])
      .then(([a, b]) => {
        if (!cancelled) {
          setCityAData(a as AirQualityPayload);
          setCityBData(b as AirQualityPayload);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cityAId, cityBId]);

  const sortedRankings = useMemo(() => {
    return [...cities].sort((a, b) => (sortAsc ? a.aqi - b.aqi : b.aqi - a.aqi));
  }, [cities, sortAsc]);

  const cleanest = useMemo(() => [...cities].sort((a, b) => a.aqi - b.aqi).slice(0, 3), [cities]);
  const mostPolluted = useMemo(() => [...cities].sort((a, b) => b.aqi - a.aqi).slice(0, 3), [cities]);

  const comparisonBarData = useMemo(() => {
    if (!cityAData || !cityBData) return [];
    return [
      {
        metric: 'PM2.5',
        [cityAData.city.name]: cityAData.pollutants.pm25 ?? 0,
        [cityBData.city.name]: cityBData.pollutants.pm25 ?? 0,
      },
      {
        metric: 'PM10',
        [cityAData.city.name]: cityAData.pollutants.pm10 ?? 0,
        [cityBData.city.name]: cityBData.pollutants.pm10 ?? 0,
      },
      {
        metric: 'NO₂',
        [cityAData.city.name]: cityAData.pollutants.no2 ?? 0,
        [cityBData.city.name]: cityBData.pollutants.no2 ?? 0,
      },
      {
        metric: 'SO₂',
        [cityAData.city.name]: cityAData.pollutants.so2 ?? 0,
        [cityBData.city.name]: cityBData.pollutants.so2 ?? 0,
      },
      {
        metric: 'O₃',
        [cityAData.city.name]: cityAData.pollutants.o3 ?? 0,
        [cityBData.city.name]: cityBData.pollutants.o3 ?? 0,
      },
    ];
  }, [cityAData, cityBData]);

  const trendCompareData = useMemo(() => {
    if (!cityAData || !cityBData) return [];
    return cityAData.history.d7.map((pt, idx) => ({
      day: pt.label,
      [cityAData.city.name]: pt.aqi,
      [cityBData.city.name]: cityBData.history.d7[idx]?.aqi ?? null,
    }));
  }, [cityAData, cityBData]);

  const pmComparisonCities = useMemo(
    () =>
      [...cities]
        .slice(0, 8)
        .map((c) => ({
          name: c.name,
          pm25: c.pm25 ?? 0,
          pm10: c.pm10 ?? 0,
        })),
    [cities]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {t.analyticsTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.analyticsSubtitle}
        </p>
      </div>

      {/* Two-City Side-by-Side Comparison */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
            {t.sideBySideTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>{t.cityA}</span>
              <select
                value={cityAId}
                onChange={(e) => setCityAId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-xs font-semibold text-slate-400">{t.vs}</span>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>{t.cityB}</span>
              <select
                value={cityBId}
                onChange={(e) => setCityBId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {cityAData && cityBData && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[cityAData, cityBData].map((item, idx) => {
                const cat = getAQICategory(item.aqi, lang);
                return (
                  <div
                    key={`${item.city.id}-${idx}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.city.state}</div>
                      <div className="font-display text-lg font-bold text-slate-950 dark:text-white">
                        {item.city.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 tabular-nums dark:text-slate-300">
                        PM2.5: {item.pollutants.pm25 ?? '--'} µg/m³ · PM10: {item.pollutants.pm10 ?? '--'} µg/m³
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-3xl font-bold text-slate-950 dark:text-white">{item.aqi}</div>
                      <div className={`text-xs font-semibold ${cat.textClass}`}>
                        {translateAQIStatus(item.status, lang)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.pollutantCompareTitle}
                </h3>
                <div className="mt-3 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#1E293B',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey={cityAData.city.name} fill="#14532D" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey={cityBData.city.name} fill="#38BDF8" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.trajectory7dTitle}
                </h3>
                <div className="mt-3 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendCompareData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#1E293B',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey={cityAData.city.name}
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey={cityBData.city.name}
                        stroke="#38BDF8"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Cleanest vs Most Polluted + PM2.5 vs PM10 Cross-City */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            {t.pmCompareTitle}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t.pmCompareSubtitle}
          </p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pmComparisonCities}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="pm25" name="PM2.5 (µg/m³)" fill="#10B981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="pm10" name="PM10 (µg/m³)" fill="#0284C7" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <TrendingDown className="h-4 w-4" aria-hidden="true" />
              {t.cleanestLocations}
            </div>
            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {cleanest.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCityId(c.id)}
                  className="flex w-full items-center justify-between py-2.5 text-left text-sm hover:opacity-80"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {idx + 1}. {c.name}, <span className="text-xs text-slate-500">{c.state}</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                    {c.aqi} AQI
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-400">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              {t.highestPollutionLocations}
            </div>
            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {mostPolluted.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCityId(c.id)}
                  className="flex w-full items-center justify-between py-2.5 text-left text-sm hover:opacity-80"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {idx + 1}. {c.name}, <span className="text-xs text-slate-500">{c.state}</span>
                  </span>
                  <span className="font-mono font-bold text-orange-600 tabular-nums dark:text-orange-400">
                    {c.aqi} AQI
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* City Pollution Rankings Table */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            {t.rankingsTitle}
          </h2>
          <button
            type="button"
            onClick={() => setSortAsc((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            {sortAsc ? t.cleanestFirst : t.highestFirst}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-6 py-3">{t.colRank}</th>
                <th className="px-6 py-3">{t.colCity}</th>
                <th className="px-6 py-3 text-right">{t.colAqi}</th>
                <th className="px-6 py-3">{t.colCategory}</th>
                <th className="px-6 py-3 text-right">PM2.5</th>
                <th className="px-6 py-3 text-right">PM10</th>
                <th className="px-6 py-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedRankings.map((city, idx) => {
                const cat = getAQICategory(city.aqi, lang);
                return (
                  <tr
                    key={city.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-slate-500 tabular-nums">{idx + 1}</td>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{city.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{city.state}</div>
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-bold text-slate-950 tabular-nums dark:text-white">
                      {city.aqi}
                    </td>
                    <td className={`px-6 py-3 text-xs font-semibold ${cat.textClass}`}>
                      {translateAQIStatus(city.status, lang)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                      {city.pm25 ?? '--'} µg/m³
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                      {city.pm10 ?? '--'} µg/m³
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectCityId(city.id)}
                        className="text-xs font-semibold text-[#14532D] hover:underline dark:text-emerald-400"
                      >
                        {t.inspect}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
