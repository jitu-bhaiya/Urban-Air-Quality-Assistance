import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { AboutMethodology } from './components/AboutMethodology';
import { AnalyticsCompare } from './components/AnalyticsCompare';
import { AuthModal } from './components/AuthModal';
import { BreatheAIAssistant } from './components/BreatheAIAssistant';
import type { SearchSuggestion } from './components/CitySearchInput';
import { CityMapExplorer } from './components/CityMapExplorer';
import { Footer } from './components/Footer';
import { HealthGuide } from './components/HealthGuide';
import { LandingPage } from './components/LandingPage';
import { LiveDashboard } from './components/LiveDashboard';
import { Navbar } from './components/Navbar';
import { ProfilePanel } from './components/ProfilePanel';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { useLanguage } from './i18n';
import type {
  AirQualityPayload,
  AppView,
  CitySummary,
  UserPreferences,
  UserProfile,
} from './types';
import { buildFavoriteAlertBody, findExceededFavoriteCities } from './utils/aqi';

function getInitialView(): AppView {
  if (typeof window === 'undefined') return 'home';
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view') as AppView | null;
  if (
    viewParam &&
    ['home', 'dashboard', 'explore', 'health', 'analytics', 'assistant', 'about'].includes(viewParam)
  ) {
    return viewParam;
  }
  if (params.get('autostart') === '1') return 'dashboard';
  return 'home';
}

export default function App() {
  const { lang, t } = useLanguage();
  const [activeView, setActiveView] = useState<AppView>(getInitialView);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [cities, setCities] = useState<CitySummary[]>([]);
  const [loadingCities, setLoadingCities] = useState<boolean>(true);

  const [selectedCityId, setSelectedCityId] = useState<string>('bengaluru');
  const [customCoords, setCustomCoords] = useState<{
    lat: number;
    lon: number;
    name: string;
    state: string;
    country: string;
  } | null>(null);

  const [cityData, setCityData] = useState<AirQualityPayload | null>(null);
  const [loadingCityData, setLoadingCityData] = useState<boolean>(true);
  const [cityDataError, setCityDataError] = useState<string | null>(null);

  const [locating, setLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Auth & Profile state (Bearer token strictly kept in React memory)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [guestFavorites, setGuestFavorites] = useState<string[]>(['bengaluru']);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const lastAlertSignatureRef = useRef<string>('');

  // Sync Tailwind dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  // Load all Indian city summaries and refresh every 60s
  const fetchCities = useCallback(() => {
    fetch('/api/cities')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load city summaries.');
        return res.json();
      })
      .then((json: { cities?: CitySummary[] }) => {
        if (Array.isArray(json.cities)) {
          setCities(json.cities);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoadingCities(false);
      });
  }, []);

  useEffect(() => {
    setLoadingCities(true);
    fetchCities();
    const timer = setInterval(fetchCities, 60_000);
    return () => clearInterval(timer);
  }, [fetchCities]);

  const fetchAirQuality = useCallback(async (forceFresh = false) => {
    setLoadingCityData(true);
    setCityDataError(null);
    try {
      const freshQuery = forceFresh ? '&fresh=1' : '';
      const url = customCoords
        ? `/api/air-quality?lat=${customCoords.lat}&lon=${customCoords.lon}&name=${encodeURIComponent(customCoords.name)}&state=${encodeURIComponent(customCoords.state)}&country=${encodeURIComponent(customCoords.country)}${freshQuery}`
        : `/api/air-quality?cityId=${encodeURIComponent(selectedCityId)}${freshQuery}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Could not retrieve air quality metrics for this location.');
      }
      const payload = (await res.json()) as AirQualityPayload;
      setCityData(payload);

      // Persist search history if signed in
      if (authToken) {
        fetch('/api/user/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            cityId: payload.city.id,
            cityName: payload.city.name,
            state: payload.city.state,
            aqi: payload.aqi,
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { user?: UserProfile } | null) => {
            if (d?.user) setUser(d.user);
          })
          .catch(() => {});
      }
    } catch (err) {
      setCityDataError(err instanceof Error ? err.message : 'Unable to fetch air quality data.');
    } finally {
      setLoadingCityData(false);
    }
  }, [selectedCityId, customCoords, authToken]);

  useEffect(() => {
    fetchAirQuality(false);
    const timer = setInterval(() => {
      fetchAirQuality(true);
    }, 60_000);
    return () => clearInterval(timer);
  }, [fetchAirQuality]);

  const handleSelectCityId = (cityId: string) => {
    setCustomCoords(null);
    setSelectedCityId(cityId);
    setActiveView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLocation = (loc: SearchSuggestion) => {
    if (loc.isCurated) {
      setCustomCoords(null);
      setSelectedCityId(loc.id);
    } else {
      setCustomCoords({
        lat: loc.lat,
        lon: loc.lon,
        name: loc.name,
        state: loc.state,
        country: loc.country,
      });
    }
    setActiveView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fallbackToIpLocation = async (reason: 'declined' | 'unavailable') => {
    try {
      const res = await fetch('/api/locate-ip');
      if (!res.ok) {
        throw new Error('IP location unavailable');
      }
      const data = (await res.json()) as {
        lat: number;
        lon: number;
        name: string;
        state: string;
        country: string;
      };
      setCustomCoords({
        lat: data.lat,
        lon: data.lon,
        name: data.name,
        state: data.state,
        country: data.country,
      });
      setLocationNotice(
        reason === 'declined'
          ? t.gpsBlockedNotice(data.name, data.state)
          : t.gpsUnavailableNotice(data.name, data.state)
      );
      if (activeView !== 'explore') {
        setActiveView('dashboard');
      }
    } catch {
      setLocationError(
        reason === 'declined'
          ? t.locationDeclinedError
          : t.locationUnavailableError
      );
    } finally {
      setLocating(false);
    }
  };

  const handleDetectLocation = () => {
    setLocationError(null);
    setLocationNotice(null);

    if (!navigator.geolocation) {
      setLocating(true);
      void fallbackToIpLocation('unavailable');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let place = {
          name: 'Current Location',
          state: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
          country: 'Detected',
        };
        try {
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const json = (await res.json()) as {
              name?: string;
              state?: string;
              country?: string;
            };
            if (json.name) {
              place = {
                name: json.name,
                state: json.state || place.state,
                country: json.country || place.country,
              };
            }
          }
        } catch {
          // Keep coordinate label fallback
        }

        setCustomCoords({ lat, lon, ...place });
        setLocating(false);
        if (activeView !== 'explore') {
          setActiveView('dashboard');
        }
      },
      (err) => {
        void fallbackToIpLocation(
          err.code === err.PERMISSION_DENIED ? 'declined' : 'unavailable'
        );
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300_000 }
    );
  };

  const handleToggleFavorite = async (cityId: string) => {
    if (!user || !authToken) {
      setGuestFavorites((prev) =>
        prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [cityId, ...prev]
      );
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ cityId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: UserProfile };
        if (data.user) setUser(data.user);
      }
    } catch {
      // Keep UI stable
    }
  };

  const handleClearHistory = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/user/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: UserProfile };
        if (data.user) setUser(data.user);
      }
    } catch {}
  };

  const handleUpdatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: UserProfile };
        if (data.user) setUser(data.user);
      }
    } catch {}
  };

  const activeFavorites = user ? user.favorites : guestFavorites;
  const sensitiveGroup = user?.preferences.sensitiveGroup ?? 'general';
  const alertThreshold = user?.preferences.thresholdAqi ?? 150;

  // Dispatch browser-based notification when a favorite city exceeds the user's personal threshold
  useEffect(() => {
    if (!user || !user.preferences.browserAlerts || cities.length === 0) {
      lastAlertSignatureRef.current = '';
      return;
    }

    const exceeded = findExceededFavoriteCities(
      cities,
      user.favorites,
      user.preferences.thresholdAqi
    );
    if (exceeded.length === 0) {
      lastAlertSignatureRef.current = '';
      return;
    }

    const signature = `${lang}:${user.preferences.thresholdAqi}:${exceeded.map((c) => `${c.id}:${c.aqi}`).join(',')}`;
    if (lastAlertSignatureRef.current === signature) return;
    lastAlertSignatureRef.current = signature;

    const body = buildFavoriteAlertBody(exceeded, user.preferences.thresholdAqi, lang);
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(`${t.brand} · ${t.favoriteAlertTitle}`, {
          body,
          tag: 'breathewell-favorite-alert',
        });
      } catch {
        // Ignore if notification API is restricted
      }
    }
  }, [user, cities, lang, t.brand, t.favoriteAlertTitle]);

  const previewCity = useMemo(() => {
    return cities.find((c) => c.id === 'bengaluru') || cities[0] || null;
  }, [cities]);

  const showToolbar = activeView !== 'home' && activeView !== 'about';

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {showToolbar && (
        <WorkspaceToolbar
          activeView={activeView}
          onNavigate={setActiveView}
          onSelectLocation={handleSelectLocation}
          onDetectLocation={handleDetectLocation}
          locating={locating}
          locationError={locationError}
          locationNotice={locationNotice}
          onDismissLocationNotice={() => setLocationNotice(null)}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((prev) => !prev)}
          alertThreshold={alertThreshold}
          currentCityName={cityData?.city.name}
          currentAqi={cityData?.aqi}
        />
      )}

      <main className="flex-1">
        {activeView === 'home' && (
          <LandingPage
            cities={cities}
            previewCity={previewCity}
            loadingCities={loadingCities}
            onSelectLocation={handleSelectLocation}
            onSelectCityId={handleSelectCityId}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'dashboard' && (
          <LiveDashboard
            data={cityData}
            loading={loadingCityData}
            error={cityDataError}
            isFavorite={Boolean(cityData && activeFavorites.includes(cityData.city.id))}
            sensitiveGroup={sensitiveGroup}
            onToggleFavorite={handleToggleFavorite}
            onRefresh={() => fetchAirQuality(true)}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'explore' && (
          <CityMapExplorer
            cities={cities}
            selectedCityId={selectedCityId}
            detectedLocation={customCoords ? cityData : null}
            darkMode={darkMode}
            onSelectCityId={handleSelectCityId}
            onOpenDetectedDashboard={() => setActiveView('dashboard')}
            onDetectLocation={handleDetectLocation}
            locating={locating}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsCompare cities={cities} onSelectCityId={handleSelectCityId} />
        )}

        {activeView === 'assistant' && (
          <BreatheAIAssistant
            currentCityData={cityData}
            sensitiveGroup={sensitiveGroup}
          />
        )}

        {activeView === 'health' && (
          <HealthGuide currentCityData={cityData} defaultGroup={sensitiveGroup} />
        )}

        {activeView === 'about' && <AboutMethodology />}
      </main>

      <Footer
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((prev) => !prev)}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(loggedInUser, token) => {
          setUser(loggedInUser);
          setAuthToken(token);
        }}
      />

      <ProfilePanel
        open={profileOpen}
        user={user}
        cities={cities}
        onClose={() => setProfileOpen(false)}
        onSelectCityId={handleSelectCityId}
        onToggleFavorite={handleToggleFavorite}
        onClearHistory={handleClearHistory}
        onUpdatePreferences={handleUpdatePreferences}
        onSendTestAlert={(msg) => setAlertNotice(msg)}
        onSignOut={() => {
          setUser(null);
          setAuthToken(null);
        }}
      />

      {alertNotice && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-amber-500/35 bg-white p-4 text-xs shadow-xl dark:border-amber-500/35 dark:bg-slate-900"
        >
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div className="flex-1 text-slate-700 dark:text-slate-200">
            <div className="font-semibold text-slate-950 dark:text-white">
              {t.favoriteAlertTitle}
            </div>
            <p className="mt-0.5 leading-relaxed">{alertNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setAlertNotice(null)}
            aria-label={t.dismissNotice}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
