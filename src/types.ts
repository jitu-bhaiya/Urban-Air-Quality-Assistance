export type AQIStatusLabel =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export type DataMode = 'measured' | 'model' | 'simulated' | 'unavailable';

export type DemographicGroup =
  | 'general'
  | 'children'
  | 'seniors'
  | 'outdoor_workers'
  | 'respiratory';

export type AppView =
  | 'home'
  | 'dashboard'
  | 'explore'
  | 'health'
  | 'analytics'
  | 'assistant'
  | 'about';

export interface PollutantReadings {
  pm25: number | null; // µg/m³
  pm10: number | null; // µg/m³
  no2: number | null; // µg/m³
  so2: number | null; // µg/m³
  co: number | null; // mg/m³
  o3: number | null; // µg/m³
}

export interface WeatherReadings {
  temperature: number | null; // °C
  humidity: number | null; // %
  windSpeed: number | null; // km/h
  windDirection?: number | null;
  apparentTemperature?: number | null;
}

export interface HistoryPoint {
  label: string;
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface MonitoringStation {
  id: string;
  name: string;
  area: string;
  lat: number;
  lon: number;
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  status: DataMode;
  lastUpdated: string;
}

export interface CitySeed {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  featured?: boolean;
  baselinePollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    o3: number;
  };
  baselineWeather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  stations: {
    id: string;
    name: string;
    area: string;
    latOffset: number;
    lonOffset: number;
    factor: number;
  }[];
}

export interface CitySummary {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  featured: boolean;
  aqi: number;
  status: AQIStatusLabel;
  dominantPollutant: string;
  pm25: number | null;
  pm10: number | null;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  dataMode: DataMode;
  dataSource: string;
  lastUpdated: string;
}

export interface AirQualityPayload {
  city: {
    id: string;
    name: string;
    state: string;
    country: string;
    lat: number;
    lon: number;
  };
  aqi: number;
  usAqi?: number | null;
  europeanAqi?: number | null;
  status: AQIStatusLabel;
  dominantPollutant: string;
  pollutants: PollutantReadings;
  weather: WeatherReadings;
  dataMode: DataMode;
  dataSource: string;
  historyMode: DataMode;
  lastUpdated: string;
  stations: MonitoringStation[];
  history: {
    h24: HistoryPoint[];
    d7: HistoryPoint[];
    d30: HistoryPoint[];
  };
}

export interface HealthGuidanceCard {
  group: DemographicGroup;
  title: string;
  summary: string;
  outdoorActivity: string;
  maskAndVentilation: string;
  exerciseSuggestion: string;
  precautions: string[];
}

export interface SearchHistoryEntry {
  cityId: string;
  cityName: string;
  state: string;
  aqi: number;
  timestamp: string;
}

export interface UserPreferences {
  thresholdAqi: number;
  emailAlerts: boolean;
  browserAlerts: boolean;
  sensitiveGroup: DemographicGroup;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isDemo?: boolean;
  favorites: string[];
  searchHistory: SearchHistoryEntry[];
  preferences: UserPreferences;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  cityContext?: string;
  aqiContext?: number;
}
