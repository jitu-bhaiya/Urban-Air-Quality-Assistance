import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Compass, LocateFixed } from 'lucide-react';
import { translateAQIStatus, useLanguage } from '../i18n';
import type { AirQualityPayload, CitySummary } from '../types';
import { getAQICategory } from '../utils/aqi';

interface CityMapExplorerProps {
  cities: CitySummary[];
  selectedCityId: string;
  detectedLocation?: AirQualityPayload | null;
  darkMode: boolean;
  onSelectCityId: (cityId: string) => void;
  onOpenDetectedDashboard?: () => void;
  onDetectLocation: () => void;
  locating: boolean;
}

type MapFilter = 'all' | 'clean' | 'moderate' | 'poor';

export function CityMapExplorer({
  cities,
  selectedCityId,
  detectedLocation,
  darkMode,
  onSelectCityId,
  onOpenDetectedDashboard,
  onDetectLocation,
  locating,
}: CityMapExplorerProps) {
  const { lang, t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [filter, setFilter] = useState<MapFilter>('all');
  const [focusedCityId, setFocusedCityId] = useState<string>(selectedCityId);

  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      if (filter === 'clean') return c.aqi <= 100;
      if (filter === 'moderate') return c.aqi > 100 && c.aqi <= 200;
      if (filter === 'poor') return c.aqi > 200;
      return true;
    });
  }, [cities, filter]);

  useEffect(() => {
    if (detectedLocation) {
      setFocusedCityId(detectedLocation.city.id);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(
          [detectedLocation.city.lat, detectedLocation.city.lon],
          7,
          { duration: 0.6 }
        );
      }
    }
  }, [detectedLocation]);

  const focusedCity: CitySummary | null = useMemo(() => {
    if (detectedLocation && focusedCityId === detectedLocation.city.id) {
      return {
        id: detectedLocation.city.id,
        name: detectedLocation.city.name,
        state: detectedLocation.city.state,
        country: detectedLocation.city.country,
        lat: detectedLocation.city.lat,
        lon: detectedLocation.city.lon,
        featured: false,
        aqi: detectedLocation.aqi,
        status: detectedLocation.status,
        dominantPollutant: detectedLocation.dominantPollutant,
        pm25: detectedLocation.pollutants.pm25,
        pm10: detectedLocation.pollutants.pm10,
        temperature: detectedLocation.weather.temperature,
        humidity: detectedLocation.weather.humidity,
        windSpeed: detectedLocation.weather.windSpeed,
        dataMode: detectedLocation.dataMode,
        dataSource: detectedLocation.dataSource,
        lastUpdated: detectedLocation.lastUpdated,
      };
    }
    return cities.find((c) => c.id === focusedCityId) || cities[0] || null;
  }, [cities, focusedCityId, detectedLocation]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.5, 79.0],
      zoom: 5,
      zoomControl: true,
    });

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Update map tiles when theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = layer;
  }, [darkMode]);

  // Render AQI markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    filteredCities.forEach((city) => {
      const cat = getAQICategory(city.aqi);
      const isSelected = city.id === focusedCityId;
      const icon = L.divIcon({
        className: 'breathewell-marker',
        html: `<div style="
          display:flex;align-items:center;justify-content:center;
          min-width:${isSelected ? '40px' : '34px'};height:${isSelected ? '28px' : '24px'};
          padding:0 6px;border-radius:8px;
          background:${cat.hex};color:#fff;
          font-family:'JetBrains Mono',monospace;font-weight:700;font-size:11px;
          border:2px solid ${isSelected ? '#0f172a' : 'rgba(255,255,255,0.92)'};
          box-shadow:0 3px 10px rgba(15,23,42,0.28);
          cursor:pointer;
        ">${city.aqi}</div>`,
        iconSize: [40, 28],
        iconAnchor: [20, 14],
      });

      const marker = L.marker([city.lat, city.lon], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0,
      });
      marker.bindPopup(
        `<div style="min-width:170px;padding:4px 2px;">
          <div style="font-weight:700;font-size:14px;">${city.name}</div>
          <div style="font-size:11px;opacity:0.75;margin-bottom:6px;">${city.state}</div>
          <div style="font-size:13px;font-weight:600;">AQI ${city.aqi} · ${city.status}</div>
          <div style="font-size:11px;margin-top:4px;">PM2.5: ${city.pm25 ?? '--'} µg/m³ · PM10: ${city.pm10 ?? '--'} µg/m³</div>
        </div>`
      );
      marker.on('click', () => {
        setFocusedCityId(city.id);
      });
      marker.addTo(layerGroup);
    });

    if (detectedLocation) {
      const cat = getAQICategory(detectedLocation.aqi);
      const isSelected = detectedLocation.city.id === focusedCityId;
      const icon = L.divIcon({
        className: 'breathewell-marker',
        html: `<div style="
          display:flex;align-items:center;justify-content:center;gap:4px;
          min-width:44px;height:28px;
          padding:0 8px;border-radius:8px;
          background:${cat.hex};color:#fff;
          font-family:'JetBrains Mono',monospace;font-weight:700;font-size:11px;
          border:2px solid ${isSelected ? '#0284c7' : '#0f172a'};
          box-shadow:0 3px 10px rgba(15,23,42,0.32);
          cursor:pointer;
        ">★ ${detectedLocation.aqi}</div>`,
        iconSize: [48, 28],
        iconAnchor: [24, 14],
      });
      const marker = L.marker([detectedLocation.city.lat, detectedLocation.city.lon], {
        icon,
        zIndexOffset: 1200,
      });
      marker.bindPopup(
        `<div style="min-width:170px;padding:4px 2px;">
          <div style="font-weight:700;font-size:14px;">${detectedLocation.city.name}</div>
          <div style="font-size:11px;opacity:0.75;margin-bottom:6px;">${detectedLocation.city.state}</div>
          <div style="font-size:13px;font-weight:600;">AQI ${detectedLocation.aqi} · ${detectedLocation.status}</div>
          <div style="font-size:11px;margin-top:4px;">PM2.5: ${detectedLocation.pollutants.pm25 ?? '--'} µg/m³ · PM10: ${detectedLocation.pollutants.pm10 ?? '--'} µg/m³</div>
        </div>`
      );
      marker.on('click', () => {
        setFocusedCityId(detectedLocation.city.id);
      });
      marker.addTo(layerGroup);
    }
  }, [filteredCities, focusedCityId, detectedLocation]);

  const handleListSelect = (city: CitySummary) => {
    setFocusedCityId(city.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([city.lat, city.lon], 7, { duration: 0.6 });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t.mapTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.mapSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                { id: 'all', label: t.filterAll },
                { id: 'clean', label: t.filterClean },
                { id: 'moderate', label: t.filterModerate },
                { id: 'poor', label: t.filterPoor },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  filter === item.id
                    ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onDetectLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LocateFixed className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
            {locating ? t.detecting : t.useMyLocation}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Interactive Leaflet Map */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div
            ref={mapContainerRef}
            data-testid="city-leaflet-map"
            className="h-[460px] w-full lg:h-[560px]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" /> {t.bandGoodLegend}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-green-500" /> {t.bandSatLegend}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-amber-500" /> {t.bandModLegend}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-orange-500" /> {t.bandPoorLegend}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-red-500" /> {t.bandVPoorLegend}</span>
            </div>
            <span className="tabular-nums">{filteredCities.length} {t.citiesShown}</span>
          </div>
        </div>

        {/* City Detail + Quick Directory */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          {focusedCity && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t.selectedMapLocation}
                  </div>
                  <h2 className="mt-0.5 font-display text-2xl font-bold text-slate-950 dark:text-white">
                    {focusedCity.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{focusedCity.state}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl font-bold text-slate-950 tabular-nums dark:text-white">
                    {focusedCity.aqi}
                  </div>
                  <div className={`text-xs font-semibold ${getAQICategory(focusedCity.aqi, lang).textClass}`}>
                    {translateAQIStatus(focusedCity.status, lang)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-xs tabular-nums dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">PM2.5</span>
                  <div className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {focusedCity.pm25 ?? '--'} µg/m³
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">PM10</span>
                  <div className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {focusedCity.pm10 ?? '--'} µg/m³
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">{t.tempLabel}</span>
                  <div className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {focusedCity.temperature ?? '--'}°C
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (detectedLocation && focusedCity.id === detectedLocation.city.id && onOpenDetectedDashboard) {
                    onOpenDetectedDashboard();
                  } else {
                    onSelectCityId(focusedCity.id);
                  }
                }}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#14532D] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                {t.openFullDashboard}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                {t.monitoredIndianCities}
              </div>
            </div>
            <div className="max-h-[300px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {filteredCities.map((city) => {
                const cat = getAQICategory(city.aqi, lang);
                const active = city.id === focusedCityId;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleListSelect(city)}
                    className={`flex w-full items-center justify-between px-5 py-3 text-left transition-colors ${
                      active
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {city.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{city.state}</div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{city.aqi}</span>
                      <div className={`text-[11px] font-medium ${cat.textClass}`}>
                        {translateAQIStatus(city.status, lang)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
