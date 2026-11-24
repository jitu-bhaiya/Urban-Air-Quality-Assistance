import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { INDIAN_CITIES } from '../data/cities';
import { useLanguage } from '../i18n';

export interface SearchSuggestion {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  isCurated: boolean;
}

interface CitySearchInputProps {
  placeholder?: string;
  onSelectLocation: (loc: SearchSuggestion) => void;
  submitLabel?: string;
  compact?: boolean;
}

export function CitySearchInput({
  placeholder,
  onSelectLocation,
  submitLabel,
  compact = false,
}: CitySearchInputProps) {
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder ?? t.searchCityPlaceholder;
  const resolvedSubmit = submitLabel ?? t.checkAirQuality;
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setSuggestions(
        INDIAN_CITIES.slice(0, 6).map((c) => ({
          id: c.id,
          name: c.name,
          state: c.state,
          country: c.country,
          lat: c.lat,
          lon: c.lon,
          isCurated: true,
        }))
      );
      return;
    }

    const localMatches = INDIAN_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        c.state.toLowerCase().includes(trimmed.toLowerCase())
    ).map((c) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      country: c.country,
      lat: c.lat,
      lon: c.lon,
      isCurated: true,
    }));

    setSuggestions(localMatches);

    if (trimmed.length < 2) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = (await res.json()) as { results?: SearchSuggestion[] };
          if (Array.isArray(data.results) && data.results.length > 0) {
            setSuggestions(data.results);
          }
        }
      } catch {
        // Keep local curated matches silently
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  const handleChoose = (loc: SearchSuggestion) => {
    setQuery(loc.name);
    setOpen(false);
    onSelectLocation(loc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleChoose(suggestions[0]);
      return;
    }
    const fallback = INDIAN_CITIES[0];
    handleChoose({
      id: fallback.id,
      name: fallback.name,
      state: fallback.state,
      country: fallback.country,
      lat: fallback.lat,
      lon: fallback.lon,
      isCurated: true,
    });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className={`flex w-full gap-2 ${
          compact
            ? 'flex-row items-center'
            : 'flex-col sm:flex-row sm:items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900'
        }`}
      >
        <div className="relative flex flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            aria-label={t.searchCityAria}
            placeholder={resolvedPlaceholder}
            className={`w-full rounded-xl bg-transparent pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 ${
              compact
                ? 'h-10 border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                : 'h-11'
            }`}
          />
        </div>

        <button
          type="submit"
          className={`inline-flex items-center justify-center rounded-xl bg-[#14532D] font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 ${
            compact ? 'h-10 px-4 text-xs' : 'h-11 px-5 text-sm'
          }`}
        >
          {resolvedSubmit}
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label={t.citySuggestionsAria}
          className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {loading ? t.searchingLocations : query.trim() ? t.matchingLocations : t.popularIndianCities}
          </div>
          {suggestions.map((loc) => (
            <button
              key={`${loc.id}-${loc.lat}`}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => handleChoose(loc)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2.5 font-medium text-slate-900 dark:text-slate-100">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{loc.name}</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {loc.state} · {loc.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
