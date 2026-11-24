import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AQIStatusLabel, DemographicGroup } from './types';

export type Language = 'en' | 'hi';

export interface Translations {
  // Brand & Nav
  brand: string;
  navHome: string;
  navLiveAqi: string;
  navExploreCities: string;
  navHealthGuide: string;
  navAbout: string;
  signIn: string;
  account: string;
  openMenu: string;
  closeMenu: string;
  switchLangLabel: string;

  // Workspace Toolbar
  tabLiveAqi: string;
  tabCityMap: string;
  tabAnalytics: string;
  tabBreatheAi: string;
  tabHealthGuide: string;
  switchCityPlaceholder: string;
  go: string;
  nearMe: string;
  locating: string;
  switchToLight: string;
  switchToDark: string;
  lightMode: string;
  darkMode: string;
  dismissNotice: string;
  airQualityAlertPrefix: string;
  exceedingThresholdSuffix: string;
  viewPrecautions: string;

  // Search Input
  searchCityPlaceholder: string;
  checkAirQuality: string;
  searchCityAria: string;
  citySuggestionsAria: string;
  searchingLocations: string;
  matchingLocations: string;
  popularIndianCities: string;

  // Landing Page
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  exploreDashboard: string;
  askBreatheAi: string;
  quickJump: string;
  liveFreeApi: string;
  simulatedRef: string;
  inspect: string;
  featuredCitiesTitle: string;
  featuredCitiesSubtitle: string;
  openInteractiveMap: string;
  dominantLabel: string;
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  healthAwareTitle: string;
  healthAwareDesc: string;
  middayVentTitle: string;
  middayVentDesc: string;
  filtrationTitle: string;
  filtrationDesc: string;
  sensitiveTitle: string;
  sensitiveDesc: string;
  exploreHealthGuide: string;
  compareIndianCities: string;

  // Live Dashboard
  unableToLoadAqi: string;
  retryFetch: string;
  liveMeasuredStation: string;
  liveFreeApiAuto: string;
  simulatedRefData: string;
  updatedPrefix: string;
  airQualityHeadingSuffix: string;
  sourcePrefix: string;
  savedCity: string;
  saveCity: string;
  copiedSummary: string;
  share: string;
  downloadCsv: string;
  refresh: string;
  refreshAria: string;
  bandPrefix: string;
  tempLabel: string;
  humidityLabel: string;
  windLabel: string;
  guidanceForPrefix: string;
  allGroups: string;
  outdoorActivity: string;
  maskAndVentilation: string;
  askBreatheAiAbout: string;
  pollutantConcentrations: string;
  pollutantThresholdNote: string;
  pollutantNames: Record<'PM2.5' | 'PM10' | 'NO₂' | 'SO₂' | 'CO' | 'O₃', string>;
  unavailable: string;
  referenceLimit: string;
  aboveLimit: string;
  withinLimit: string;
  noSensorData: string;
  historicalTrendTitle: string;
  historicalSimulatedNote: string;
  historicalArchiveNote: string;
  range24h: string;
  range7d: string;
  range30d: string;
  stationsTitle: string;
  stationsSubtitlePrefix: string;
  viewOnInteractiveMap: string;
  openAqMeasuredStation: string;
  gridModelNode: string;
  simulatedNode: string;
  stationTelemetryActive: string;

  // City Map Explorer
  mapTitle: string;
  mapSubtitle: string;
  filterAll: string;
  filterClean: string;
  filterModerate: string;
  filterPoor: string;
  useMyLocation: string;
  detecting: string;
  bandGoodLegend: string;
  bandSatLegend: string;
  bandModLegend: string;
  bandPoorLegend: string;
  bandVPoorLegend: string;
  citiesShown: string;
  selectedMapLocation: string;
  openFullDashboard: string;
  monitoredIndianCities: string;

  // Analytics & Compare
  analyticsTitle: string;
  analyticsSubtitle: string;
  sideBySideTitle: string;
  cityA: string;
  cityB: string;
  vs: string;
  pollutantCompareTitle: string;
  trajectory7dTitle: string;
  pmCompareTitle: string;
  pmCompareSubtitle: string;
  cleanestLocations: string;
  highestPollutionLocations: string;
  rankingsTitle: string;
  cleanestFirst: string;
  highestFirst: string;
  colRank: string;
  colCity: string;
  colAqi: string;
  colCategory: string;
  colAction: string;

  // BreatheAI Assistant
  aiTitle: string;
  aiSubtitle: string;
  activeContext: string;
  aiDisclaimerStrong: string;
  aiDisclaimerText: string;
  analyzingPrefix: string;
  analyzingSuffix: string;
  suggestedQuestions: string;
  aiInputPlaceholderPrefix: string;
  aiAskBtn: string;
  aiQuickPrompts: string[];

  // Health Guide
  healthTitle: string;
  healthSubtitlePrefix: string;
  healthDisclaimer: string;
  calibratedForPrefix: string;
  referenceAqi: string;
  outdoorActivityGuidance: string;
  maskIndoorVentilation: string;
  exerciseSuggestions: string;
  exposurePrecautions: string;
  groupLabels: Record<DemographicGroup, string>;

  // About & Methodology
  aboutTitle: string;
  aboutSubtitle: string;
  provenanceTitle: string;
  prov1Title: string;
  prov1Desc: string;
  prov2Title: string;
  prov2Desc: string;
  prov3Title: string;
  prov3Desc: string;
  naqiScaleTitle: string;
  naqiScaleDesc: string;
  privacyTitle: string;
  privacyDesc: string;

  // Auth Modal
  signInTitle: string;
  signUpTitle: string;
  authSubtitle: string;
  signUp: string;
  fullName: string;
  emailAddress: string;
  password: string;
  passwordPlaceholder: string;
  pleaseWait: string;
  createAccount: string;
  demoLoginBtn: string;
  authNameError: string;
  authEmailError: string;
  authPasswordError: string;

  // Profile Panel
  demoProfileTag: string;
  notificationSettings: string;
  browserAlertsTitle: string;
  browserAlertsDesc: string;
  permGranted: string;
  permDenied: string;
  permDefault: string;
  permUnsupported: string;
  personalThreshold: string;
  alertsPausedText: string;
  saveCityMonitorPrompt: string;
  sendTestAlert: string;
  testDispatched: string;
  testBlockedPreview: string;
  testInAppPreview: string;
  defaultHealthProfile: string;
  savedFavoriteCities: string;
  noSavedCities: string;
  abovePrefix: string;
  recentSearches: string;
  clear: string;
  noRecentSearches: string;
  signOut: string;
  favoriteAlertTitle: string;

  // Footer
  footerDesc: string;
  footerDisclaimer: string;
  platformHeading: string;
  guidanceHeading: string;
  displayLinksHeading: string;
  liveAqiDashboardLink: string;
  interactiveCityMapLink: string;
  trendsComparisonLink: string;
  breatheAiAssistantLink: string;
  methodologySourcesLink: string;
  footerCopyright: string;
  footerDataAttr: string;

  // Geolocation Notices
  gpsBlockedNotice: (name: string, state: string) => string;
  gpsUnavailableNotice: (name: string, state: string) => string;
  locationDeclinedError: string;
  locationUnavailableError: string;
}

const EN: Translations = {
  brand: 'BreatheWell',
  navHome: 'Home',
  navLiveAqi: 'Live AQI',
  navExploreCities: 'Explore Cities',
  navHealthGuide: 'Health Guide',
  navAbout: 'About',
  signIn: 'Sign In',
  account: 'Account',
  openMenu: 'Open navigation menu',
  closeMenu: 'Close navigation menu',
  switchLangLabel: 'Switch language',

  tabLiveAqi: 'Live AQI',
  tabCityMap: 'City Map',
  tabAnalytics: 'Analytics & Compare',
  tabBreatheAi: 'BreatheAI',
  tabHealthGuide: 'Health Guide',
  switchCityPlaceholder: 'Switch city...',
  go: 'Go',
  nearMe: 'Near Me',
  locating: 'Locating...',
  switchToLight: 'Switch to light mode',
  switchToDark: 'Switch to dark mode',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  dismissNotice: 'Dismiss notice',
  airQualityAlertPrefix: 'Air Quality Alert:',
  exceedingThresholdSuffix: 'exceeding your alert threshold',
  viewPrecautions: 'View Precautions',

  searchCityPlaceholder: 'Search your city or location...',
  checkAirQuality: 'Check Air Quality',
  searchCityAria: 'Search city or location',
  citySuggestionsAria: 'City suggestions',
  searchingLocations: 'Searching locations...',
  matchingLocations: 'Matching locations',
  popularIndianCities: 'Popular Indian cities',

  heroEyebrow: 'Urban Air Intelligence · CPCB NAQI Standard',
  heroTitle: 'Breathe Better. Live Healthier.',
  heroSubtitle:
    'Understand the air around you with real-time air quality insights and personalized health guidance.',
  exploreDashboard: 'Explore Dashboard',
  askBreatheAi: 'Ask BreatheAI',
  quickJump: 'Quick jump:',
  liveFreeApi: 'Live Free API',
  simulatedRef: 'Simulated Ref',
  inspect: 'Inspect',
  featuredCitiesTitle: 'Featured Indian Cities',
  featuredCitiesSubtitle:
    'Select any metropolitan hub to view detailed pollutant concentrations, weather conditions, and 24-hour trends.',
  openInteractiveMap: 'Open Interactive City Map',
  dominantLabel: 'Dominant',
  howItWorksTitle: 'How BreatheWell Translates Air Telemetry',
  howItWorksSubtitle:
    'Raw pollutant concentrations mean little without context. BreatheWell combines live atmospheric observations, official Indian NAQI breakpoints, and clear protective steps.',
  step1Title: '01. Live Observations & Transparent Provenance',
  step1Desc:
    'We query atmospheric particulate, gas, and meteorological feeds in real time and explicitly label whether values come from live models, monitoring stations, or offline reference simulations.',
  step2Title: '02. Six-Pollutant NAQI & Weather Context',
  step2Desc:
    'Every reading maps PM2.5, PM10, NO₂, SO₂, CO, and O₃ against Indian CPCB sub-indices alongside wind speed and humidity to highlight dispersion patterns.',
  step3Title: '03. Tailored Daily Guidance with BreatheAI',
  step3Desc:
    'Switch between demographic profiles—children, seniors, outdoor workers, and respiratory sensitivities—or ask BreatheAI about today’s commute and workout timing.',
  healthAwareTitle: 'Practical Protection for Every Lung',
  healthAwareDesc:
    'Fine particulate matter (PM2.5) is less than 3% the diameter of a human hair and penetrates deep into airways. Small daily timing adjustments significantly lower cumulative exposure.',
  middayVentTitle: 'Midday Ventilation',
  middayVentDesc:
    'Afternoon solar warming typically lifts inversion layers and lowers street-level PM2.5.',
  filtrationTitle: 'Proper Filtration',
  filtrationDesc:
    'Certified N95/FFP2 masks filter fine particles effectively when AQI rises above 200.',
  sensitiveTitle: 'Sensitive Groups',
  sensitiveDesc: 'Children, older adults, and people with asthma benefit from lower thresholds.',
  exploreHealthGuide: 'Explore Health Guide',
  compareIndianCities: 'Compare Indian Cities',

  unableToLoadAqi: 'Unable to Load Air Quality Data',
  retryFetch: 'Retry Fetch',
  liveMeasuredStation: 'Live Measured Station',
  liveFreeApiAuto: 'Live Free API (Auto 60s)',
  simulatedRefData: 'Simulated Reference Data',
  updatedPrefix: 'Updated',
  airQualityHeadingSuffix: 'Air Quality',
  sourcePrefix: 'Source:',
  savedCity: 'Saved City',
  saveCity: 'Save City',
  copiedSummary: 'Copied Summary',
  share: 'Share',
  downloadCsv: 'Download CSV',
  refresh: 'Refresh',
  refreshAria: 'Refresh air quality readings',
  bandPrefix: 'Band',
  tempLabel: 'Temp',
  humidityLabel: 'Humidity',
  windLabel: 'Wind',
  guidanceForPrefix: 'Guidance for',
  allGroups: 'All Groups',
  outdoorActivity: 'Outdoor Activity',
  maskAndVentilation: 'Mask & Ventilation',
  askBreatheAiAbout: 'Ask BreatheAI About',
  pollutantConcentrations: 'Pollutant Concentrations',
  pollutantThresholdNote: 'Bars show ratio against 24-hr / 8-hr CPCB reference threshold',
  pollutantNames: {
    'PM2.5': 'Fine Particulates',
    PM10: 'Coarse Particulates',
    'NO₂': 'Nitrogen Dioxide',
    'SO₂': 'Sulfur Dioxide',
    CO: 'Carbon Monoxide',
    'O₃': 'Ground Ozone',
  },
  unavailable: 'Unavailable',
  referenceLimit: 'Reference limit:',
  aboveLimit: 'Above limit',
  withinLimit: 'Within limit',
  noSensorData: 'No sensor data',
  historicalTrendTitle: 'Historical Air Quality Trend',
  historicalSimulatedNote: 'Includes reference diurnal/seasonal model series for long-range context',
  historicalArchiveNote: 'Derived from hourly Open-Meteo CAMS atmospheric archive',
  range24h: '24 Hours',
  range7d: '7 Days',
  range30d: '30 Days',
  stationsTitle: 'Monitoring Stations & Reference Nodes',
  stationsSubtitlePrefix: 'Sub-city telemetry nodes around',
  viewOnInteractiveMap: 'View on Interactive Map',
  openAqMeasuredStation: 'OpenAQ Measured Station',
  gridModelNode: 'Grid Model Node',
  simulatedNode: 'Simulated Node',
  stationTelemetryActive: 'Station Telemetry Active',

  mapTitle: 'Explore Indian Cities Map',
  mapSubtitle:
    'Click any color-coded AQI marker to inspect local particulate levels, weather, and monitoring coverage.',
  filterAll: 'All',
  filterClean: 'Good / Sat. (≤100)',
  filterModerate: 'Moderate',
  filterPoor: 'Poor+ (>200)',
  useMyLocation: 'Use My Location',
  detecting: 'Detecting...',
  bandGoodLegend: 'Good (0–50)',
  bandSatLegend: 'Satisfactory (51–100)',
  bandModLegend: 'Moderate (101–200)',
  bandPoorLegend: 'Poor (201–300)',
  bandVPoorLegend: 'Very Poor / Severe (301+)',
  citiesShown: 'cities shown',
  selectedMapLocation: 'Selected Map Location',
  openFullDashboard: 'Open Full Dashboard',
  monitoredIndianCities: 'Monitored Indian Cities',

  analyticsTitle: 'Pollution Trends & City Comparison',
  analyticsSubtitle:
    'Compare two cities side by side, examine PM2.5 vs PM10 particulate ratios, and review regional rankings.',
  sideBySideTitle: 'Side-by-Side City Comparator',
  cityA: 'City A',
  cityB: 'City B',
  vs: 'vs',
  pollutantCompareTitle: 'Pollutant Comparison (µg/m³)',
  trajectory7dTitle: '7-Day AQI Trajectory',
  pmCompareTitle: 'PM2.5 vs PM10 Across Monitored Cities',
  pmCompareSubtitle:
    'Fine combustion particulates (PM2.5) compared against coarse road/construction dust (PM10)',
  cleanestLocations: 'Cleanest Monitored Locations',
  highestPollutionLocations: 'Highest Pollution Locations',
  rankingsTitle: 'Indian City Pollution Rankings',
  cleanestFirst: 'Cleanest First',
  highestFirst: 'Highest AQI First',
  colRank: 'Rank',
  colCity: 'City',
  colAqi: 'AQI',
  colCategory: 'Category',
  colAction: 'Action',

  aiTitle: 'BreatheAI Health Assistant',
  aiSubtitle:
    "Context-aware air quality guidance powered by your selected city's live telemetry.",
  activeContext: 'Active Context:',
  aiDisclaimerStrong: 'Informational Guidance Only:',
  aiDisclaimerText:
    'BreatheAI provides general environmental and air pollution exposure tips. It does not offer medical diagnoses or clinical treatment advice. Consult a qualified clinician for respiratory symptoms.',
  analyzingPrefix: 'Analyzing',
  analyzingSuffix: 'conditions...',
  suggestedQuestions: 'Suggested Questions',
  aiInputPlaceholderPrefix: 'Ask BreatheAI about',
  aiAskBtn: 'Ask',
  aiQuickPrompts: [
    'Is it safe to go outside today?',
    'Should I exercise outdoors?',
    'What precautions should children take?',
    'How can I protect myself from PM2.5?',
    'What is the best time for outdoor activities?',
  ],

  healthTitle: 'Personalized Health Recommendations',
  healthSubtitlePrefix: 'Tailored outdoor activity, ventilation, mask, and exercise guidance calibrated to',
  healthDisclaimer: 'Informational wellness guidance only · Not a medical diagnosis',
  calibratedForPrefix: 'Calibrated for',
  referenceAqi: 'Reference AQI',
  outdoorActivityGuidance: 'Outdoor Activity Guidance',
  maskIndoorVentilation: 'Mask & Indoor Ventilation',
  exerciseSuggestions: 'Exercise Suggestions',
  exposurePrecautions: 'Pollution Exposure Precautions',
  groupLabels: {
    general: 'General Population',
    children: 'Children',
    seniors: 'Senior Citizens',
    outdoor_workers: 'Outdoor Workers',
    respiratory: 'Respiratory Sensitivities',
  },

  aboutTitle: 'About BreatheWell & Data Methodology',
  aboutSubtitle:
    'BreatheWell is built to make urban air quality transparent, scientifically grounded, and immediately actionable for residents across India.',
  provenanceTitle: 'Data Provenance & Labeling',
  prov1Title: 'Live Atmospheric Model (Open-Meteo CAMS & Weather):',
  prov1Desc:
    'Real-time hourly particulate (PM2.5, PM10) and trace gas (NO₂, SO₂, CO, O₃) concentrations combined with live temperature, humidity, and wind speed.',
  prov2Title: 'OpenAQ Station Registry:',
  prov2Desc:
    'When ground monitoring stations respond within our latency window, station coordinates and metadata are surfaced directly on the dashboard.',
  prov3Title: 'Simulated Reference Fallback:',
  prov3Desc:
    'If upstream environmental APIs are unreachable or rate-limited, BreatheWell clearly labels readings as Simulated Reference Data and never disguises fallback baselines as live station measurements.',
  naqiScaleTitle: 'Indian National Air Quality Index (CPCB NAQI)',
  naqiScaleDesc:
    'Overall AQI is determined by the highest sub-index across monitored pollutants using Central Pollution Control Board breakpoints.',
  privacyTitle: 'Medical & Location Privacy Disclaimer:',
  privacyDesc:
    'BreatheWell detects your geographic coordinates only when you explicitly click “Near Me” or “Use My Location” and grant browser permission (with approximate IP lookup only if GPS is blocked). All health recommendations and BreatheAI responses are strictly informational and do not constitute medical diagnosis or clinical advice.',

  signInTitle: 'Sign In to BreatheWell',
  signUpTitle: 'Create Your BreatheWell Account',
  authSubtitle:
    'Save favorite Indian cities, track your search history, and customize AQI alert thresholds.',
  signUp: 'Sign Up',
  fullName: 'Full Name',
  emailAddress: 'Email Address',
  password: 'Password',
  passwordPlaceholder: 'Minimum 8 characters',
  pleaseWait: 'Please wait...',
  createAccount: 'Create Account',
  demoLoginBtn: 'Sign In with Demo Profile (Aarav Sharma)',
  authNameError: 'Please enter your name (at least 2 characters).',
  authEmailError: 'Please enter a valid email address.',
  authPasswordError: 'Password must be at least 8 characters long.',

  demoProfileTag: 'Demo Profile',
  notificationSettings: 'Notification Settings',
  browserAlertsTitle: 'Browser Favorite-City Alerts',
  browserAlertsDesc:
    'Receive a browser alert whenever any saved favorite city reaches your AQI threshold.',
  permGranted: 'Browser permission granted',
  permDenied: 'Blocked in browser settings (in-app alerts active)',
  permDefault: 'Browser permission will be requested on opt-in',
  permUnsupported: 'Browser Notification API unavailable (in-app alerts active)',
  personalThreshold: 'Personal AQI Alert Threshold',
  alertsPausedText: 'Browser favorite-city alerts are currently paused.',
  saveCityMonitorPrompt: 'Save a favorite city below to monitor its live AQI against your threshold.',
  sendTestAlert: 'Send Test Alert',
  testDispatched: 'Browser notification dispatched.',
  testBlockedPreview: 'Browser popups are blocked; previewed alert inside the app instead.',
  testInAppPreview: 'Previewed favorite-city alert inside the app.',
  defaultHealthProfile: 'Default Health Profile',
  savedFavoriteCities: 'Saved Favorite Cities',
  noSavedCities: 'No saved cities yet. Click “Save City” on any city dashboard to pin it here.',
  abovePrefix: 'Above',
  recentSearches: 'Recent Searches',
  clear: 'Clear',
  noRecentSearches: 'Cities you inspect while signed in will appear here.',
  signOut: 'Sign Out',
  favoriteAlertTitle: 'Favorite City AQI Alert',

  footerDesc:
    'Urban air quality assistance helping residents interpret real-time atmospheric telemetry, compare regional trends, and plan healthier daily routines.',
  footerDisclaimer: 'Air quality guidance is informational only and does not replace medical advice.',
  platformHeading: 'Platform',
  guidanceHeading: 'Guidance',
  displayLinksHeading: 'Display & Links',
  liveAqiDashboardLink: 'Live AQI Dashboard',
  interactiveCityMapLink: 'Interactive City Map',
  trendsComparisonLink: 'Trends & Comparison',
  breatheAiAssistantLink: 'BreatheAI Assistant',
  methodologySourcesLink: 'Methodology & Sources',
  footerCopyright: '© 2026 BreatheWell Urban Air Quality Assistance.',
  footerDataAttr: 'Data: Open-Meteo CAMS, OpenAQ Registry & CPCB NAQI Reference Standards.',

  gpsBlockedNotice: (name, state) =>
    `Browser GPS access was blocked; showing live AQI for approximate network location (${name}, ${state}).`,
  gpsUnavailableNotice: (name, state) =>
    `GPS coordinates were unavailable; showing live AQI for approximate network location (${name}, ${state}).`,
  locationDeclinedError:
    'Location permission was declined and automatic lookup failed. Please search your city manually above.',
  locationUnavailableError:
    'Unable to detect your location automatically. Please search your city manually above.',
};

const HI: Translations = {
  brand: 'BreatheWell',
  navHome: 'होम',
  navLiveAqi: 'लाइव AQI',
  navExploreCities: 'शहर मानचित्र',
  navHealthGuide: 'स्वास्थ्य गाइड',
  navAbout: 'परिचय',
  signIn: 'साइन इन',
  account: 'खाता',
  openMenu: 'नेविगेशन मेनू खोलें',
  closeMenu: 'नेविगेशन मेनू बंद करें',
  switchLangLabel: 'भाषा बदलें',

  tabLiveAqi: 'लाइव AQI',
  tabCityMap: 'शहर मानचित्र',
  tabAnalytics: 'विश्लेषण व तुलना',
  tabBreatheAi: 'BreatheAI',
  tabHealthGuide: 'स्वास्थ्य गाइड',
  switchCityPlaceholder: 'शहर बदलें...',
  go: 'खोजें',
  nearMe: 'मेरे पास',
  locating: 'खोज रहे हैं...',
  switchToLight: 'लाइट मोड चालू करें',
  switchToDark: 'डार्क मोड चालू करें',
  lightMode: 'लाइट मोड',
  darkMode: 'डार्क मोड',
  dismissNotice: 'सूचना बंद करें',
  airQualityAlertPrefix: 'वायु गुणवत्ता चेतावनी:',
  exceedingThresholdSuffix: 'आपकी निर्धारित सीमा से अधिक है',
  viewPrecautions: 'सावधानियाँ देखें',

  searchCityPlaceholder: 'अपना शहर या स्थान खोजें...',
  checkAirQuality: 'AQI जांचें',
  searchCityAria: 'शहर या स्थान खोजें',
  citySuggestionsAria: 'शहर के सुझाव',
  searchingLocations: 'स्थान खोज रहे हैं...',
  matchingLocations: 'मिलते-जुलते स्थान',
  popularIndianCities: 'प्रमुख भारतीय शहर',

  heroEyebrow: 'शहरी वायु सूचना · CPCB NAQI मानक',
  heroTitle: 'बेहतर सांस लें। स्वस्थ जीवन जिएं।',
  heroSubtitle:
    'रीयल-टाइम वायु गुणवत्ता डेटा और व्यक्तिगत स्वास्थ्य सलाह के साथ अपने आसपास की हवा को समझें।',
  exploreDashboard: 'डैशबोर्ड देखें',
  askBreatheAi: 'BreatheAI से पूछें',
  quickJump: 'त्वरित चयन:',
  liveFreeApi: 'लाइव API',
  simulatedRef: 'सिमुलेटेड संदर्भ',
  inspect: 'देखें',
  featuredCitiesTitle: 'प्रमुख भारतीय शहर',
  featuredCitiesSubtitle:
    'प्रदूषकों की मात्रा, मौसम की स्थिति और 24 घंटे का रुझान देखने के लिए किसी भी शहर को चुनें।',
  openInteractiveMap: 'इंटरैक्टिव शहर मानचित्र खोलें',
  dominantLabel: 'प्रमुख प्रदूषक',
  howItWorksTitle: 'BreatheWell वायु डेटा को कैसे सरल बनाता है',
  howItWorksSubtitle:
    'केवल कच्चे आंकड़े काफी नहीं होते। BreatheWell लाइव वायुमंडलीय डेटा, भारतीय NAQI मानकों और आसान सुरक्षा उपायों को एक साथ लाता है।',
  step1Title: '01. लाइव डेटा और स्पष्ट स्रोत पहचान',
  step1Desc:
    'हम रीयल-टाइम में कणों, गैसों और मौसम का डेटा प्राप्त करते हैं और स्पष्ट रूप से दिखाते हैं कि आंकड़े लाइव मॉडल, मॉनिटरिंग स्टेशन या संदर्भ सिमुलेशन से हैं।',
  step2Title: '02. छह-प्रदूषक NAQI और मौसम संदर्भ',
  step2Desc:
    'प्रत्येक रीडिंग PM2.5, PM10, NO₂, SO₂, CO और O₃ को भारतीय CPCB मानकों, हवा की गति और नमी के साथ जोड़कर दिखाती है।',
  step3Title: '03. BreatheAI के साथ व्यक्तिगत दैनिक सलाह',
  step3Desc:
    'बच्चों, वरिष्ठ नागरिकों, आउटडोर कामगारों और श्वसन संवेदनशीलता वाले लोगों के लिए प्रोफ़ाइल बदलें या BreatheAI से आज के समय की सलाह पूछें।',
  healthAwareTitle: 'हर फेफड़े के लिए व्यावहारिक सुरक्षा',
  healthAwareDesc:
    'सूक्ष्म कण (PM2.5) मानव बाल की चौड़ाई से 3% से भी छोटे होते हैं और फेफड़ों में गहराई तक जाते हैं। दिन के समय में छोटे बदलाव जोखिम को काफी कम कर सकते हैं।',
  middayVentTitle: 'दोपहर का वेंटिलेशन',
  middayVentDesc:
    'दोपहर की धूप से हवा ऊपर उठती है, जिससे सड़क स्तर पर PM2.5 का स्तर अक्सर कम हो जाता है।',
  filtrationTitle: 'सही मास्क सुरक्षा',
  filtrationDesc:
    'AQI 200 से ऊपर जाने पर प्रमाणित N95/FFP2 मास्क सूक्ष्म कणों को प्रभावी ढंग से छानते हैं।',
  sensitiveTitle: 'संवेदनशील समूह',
  sensitiveDesc: 'बच्चों, बुजुर्गों और अस्थमा रोगियों को कम AQI स्तर पर भी सावधानी बरतनी चाहिए।',
  exploreHealthGuide: 'स्वास्थ्य गाइड देखें',
  compareIndianCities: 'भारतीय शहरों की तुलना करें',

  unableToLoadAqi: 'वायु गुणवत्ता डेटा लोड नहीं हो सका',
  retryFetch: 'पुनः प्रयास करें',
  liveMeasuredStation: 'लाइव स्टेशन रीडिंग',
  liveFreeApiAuto: 'लाइव फ्री API (हर 60 सेकंड)',
  simulatedRefData: 'सिमुलेटेड संदर्भ डेटा',
  updatedPrefix: 'अपडेट:',
  airQualityHeadingSuffix: 'वायु गुणवत्ता',
  sourcePrefix: 'स्रोत:',
  savedCity: 'सहेजा गया शहर',
  saveCity: 'शहर सहेजें',
  copiedSummary: 'सारांश कॉपी हुआ',
  share: 'साझा करें',
  downloadCsv: 'CSV डाउनलोड',
  refresh: 'रिफ्रेश',
  refreshAria: 'वायु गुणवत्ता रीडिंग रिफ्रेश करें',
  bandPrefix: 'श्रेणी',
  tempLabel: 'तापमान',
  humidityLabel: 'नमी',
  windLabel: 'हवा',
  guidanceForPrefix: 'स्वास्थ्य सलाह:',
  allGroups: 'सभी समूह',
  outdoorActivity: 'बाहरी गतिविधि',
  maskAndVentilation: 'मास्क और वेंटिलेशन',
  askBreatheAiAbout: 'BreatheAI से पूछें:',
  pollutantConcentrations: 'प्रदूषकों की मात्रा',
  pollutantThresholdNote: 'बार 24-घंटे / 8-घंटे की CPCB मानक सीमा के अनुपात को दर्शाते हैं',
  pollutantNames: {
    'PM2.5': 'सूक्ष्म कण (PM2.5)',
    PM10: 'मोटे कण (PM10)',
    'NO₂': 'नाइट्रोजन डाइऑक्साइड',
    'SO₂': 'सल्फर डाइऑक्साइड',
    CO: 'कार्बन मोनोऑक्साइड',
    'O₃': 'जमीनी ओज़ोन',
  },
  unavailable: 'उपलब्ध नहीं',
  referenceLimit: 'मानक सीमा:',
  aboveLimit: 'सीमा से अधिक',
  withinLimit: 'सीमा के भीतर',
  noSensorData: 'सेंसर डेटा नहीं',
  historicalTrendTitle: 'पिछला वायु गुणवत्ता रुझान',
  historicalSimulatedNote: 'दीर्घकालिक संदर्भ के लिए दैनिक/मौसमी मॉडल श्रृंखला शामिल है',
  historicalArchiveNote: 'Open-Meteo CAMS प्रति-घंटा वायुमंडलीय डेटा पर आधारित',
  range24h: '24 घंटे',
  range7d: '7 दिन',
  range30d: '30 दिन',
  stationsTitle: 'मॉनिटरिंग स्टेशन और संदर्भ केंद्र',
  stationsSubtitlePrefix: 'आसपास के उप-शहरी केंद्र:',
  viewOnInteractiveMap: 'मानचित्र पर देखें',
  openAqMeasuredStation: 'OpenAQ मापित स्टेशन',
  gridModelNode: 'ग्रिड मॉडल नोड',
  simulatedNode: 'सिमुलेटेड नोड',
  stationTelemetryActive: 'स्टेशन टेलीमेट्री सक्रिय',

  mapTitle: 'भारतीय शहर मानचित्र देखें',
  mapSubtitle:
    'स्थानीय कण स्तर, मौसम और स्टेशन कवरेज देखने के लिए किसी भी रंगीन AQI मार्कर पर क्लिक करें।',
  filterAll: 'सभी',
  filterClean: 'अच्छा / संतोषजनक (≤100)',
  filterModerate: 'मध्यम',
  filterPoor: 'खराब+ (>200)',
  useMyLocation: 'मेरा स्थान उपयोग करें',
  detecting: 'खोज रहे हैं...',
  bandGoodLegend: 'अच्छा (0–50)',
  bandSatLegend: 'संतोषजनक (51–100)',
  bandModLegend: 'मध्यम (101–200)',
  bandPoorLegend: 'खराब (201–300)',
  bandVPoorLegend: 'बहुत खराब / गंभीर (301+)',
  citiesShown: 'शहर प्रदर्शित',
  selectedMapLocation: 'चयनित मानचित्र स्थान',
  openFullDashboard: 'पूरा डैशबोर्ड खोलें',
  monitoredIndianCities: 'मॉनिटर किए गए भारतीय शहर',

  analyticsTitle: 'प्रदूषण रुझान और शहर तुलना',
  analyticsSubtitle:
    'दो शहरों की साथ-साथ तुलना करें, PM2.5 बनाम PM10 अनुपात जांचें और क्षेत्रीय रैंकिंग देखें।',
  sideBySideTitle: 'दो शहरों की सीधी तुलना',
  cityA: 'शहर A',
  cityB: 'शहर B',
  vs: 'बनाम',
  pollutantCompareTitle: 'प्रदूषक तुलना (µg/m³)',
  trajectory7dTitle: '7-दिन का AQI रुझान',
  pmCompareTitle: 'शहरों में PM2.5 बनाम PM10 तुलना',
  pmCompareSubtitle: 'दहन से निकले सूक्ष्म कण (PM2.5) बनाम सड़क/निर्माण धूल कण (PM10)',
  cleanestLocations: 'सबसे स्वच्छ शहर',
  highestPollutionLocations: 'सबसे अधिक प्रदूषित शहर',
  rankingsTitle: 'भारतीय शहर प्रदूषण रैंकिंग',
  cleanestFirst: 'सबसे स्वच्छ पहले',
  highestFirst: 'सबसे अधिक AQI पहले',
  colRank: 'रैंक',
  colCity: 'शहर',
  colAqi: 'AQI',
  colCategory: 'श्रेणी',
  colAction: 'कार्रवाई',

  aiTitle: 'BreatheAI स्वास्थ्य सहायक',
  aiSubtitle: 'आपके चयनित शहर के लाइव डेटा पर आधारित स्मार्ट वायु गुणवत्ता सलाह।',
  activeContext: 'सक्रिय शहर:',
  aiDisclaimerStrong: 'केवल सामान्य जानकारी:',
  aiDisclaimerText:
    'BreatheAI वायु प्रदूषण से बचाव के सामान्य सुझाव देता है। यह चिकित्सीय निदान या उपचार की सलाह नहीं है। सांस की समस्या होने पर डॉक्टर से परामर्श लें।',
  analyzingPrefix: 'विश्लेषण जारी:',
  analyzingSuffix: 'वायु स्थिति...',
  suggestedQuestions: 'सुझाए गए प्रश्न',
  aiInputPlaceholderPrefix: 'BreatheAI से पूछें:',
  aiAskBtn: 'पूछें',
  aiQuickPrompts: [
    'क्या आज बाहर जाना सुरक्षित है?',
    'क्या मुझे बाहर व्यायाम करना चाहिए?',
    'बच्चों को क्या सावधानियाँ बरतनी चाहिए?',
    'मैं PM2.5 से अपना बचाव कैसे कर सकता हूँ?',
    'बाहरी गतिविधियों के लिए सबसे अच्छा समय क्या है?',
  ],

  healthTitle: 'व्यक्तिगत स्वास्थ्य सुझाव',
  healthSubtitlePrefix: 'चयनित शहर के अनुसार बाहरी गतिविधि, वेंटिलेशन, मास्क और व्यायाम की सलाह:',
  healthDisclaimer: 'केवल सामान्य स्वास्थ्य जानकारी · चिकित्सीय निदान नहीं',
  calibratedForPrefix: 'वायु स्तर:',
  referenceAqi: 'संदर्भ AQI',
  outdoorActivityGuidance: 'बाहरी गतिविधि सलाह',
  maskIndoorVentilation: 'मास्क और घर का वेंटिलेशन',
  exerciseSuggestions: 'व्यायाम सुझाव',
  exposurePrecautions: 'प्रदूषण से बचाव के उपाय',
  groupLabels: {
    general: 'सामान्य नागरिक',
    children: 'बच्चे',
    seniors: 'वरिष्ठ नागरिक',
    outdoor_workers: 'बाहरी कामगार',
    respiratory: 'श्वसन संवेदनशीलता',
  },

  aboutTitle: 'BreatheWell परिचय और डेटा कार्यप्रणाली',
  aboutSubtitle:
    'BreatheWell का उद्देश्य भारत भर के नागरिकों के लिए वायु गुणवत्ता डेटा को पारदर्शी, वैज्ञानिक और तुरंत उपयोगी बनाना है।',
  provenanceTitle: 'डेटा स्रोत और पारदर्शिता',
  prov1Title: 'लाइव वायुमंडलीय मॉडल (Open-Meteo CAMS और मौसम):',
  prov1Desc:
    'रीयल-टाइम कण (PM2.5, PM10) और गैस (NO₂, SO₂, CO, O₃) स्तरों के साथ लाइव तापमान, नमी और हवा की गति।',
  prov2Title: 'OpenAQ स्टेशन रजिस्ट्री:',
  prov2Desc:
    'जब ग्राउंड मॉनिटरिंग स्टेशन उपलब्ध होते हैं, तो उनके निर्देशांक और विवरण सीधे डैशबोर्ड पर दिखाए जाते हैं।',
  prov3Title: 'सिमुलेटेड संदर्भ फ़ॉलबैक:',
  prov3Desc:
    'यदि बाहरी API अनुपलब्ध हों, तो BreatheWell रीडिंग को स्पष्ट रूप से सिमुलेटेड संदर्भ डेटा के रूप में लेबल करता है।',
  naqiScaleTitle: 'भारतीय राष्ट्रीय वायु गुणवत्ता सूचकांक (CPCB NAQI)',
  naqiScaleDesc:
    'केंद्रीय प्रदूषण नियंत्रण बोर्ड (CPCB) मानकों के अनुसार सभी प्रदूषकों में उच्चतम उप-सूचकांक से कुल AQI तय होता है।',
  privacyTitle: 'चिकित्सा एवं लोकेशन गोपनीयता सूचना:',
  privacyDesc:
    'BreatheWell आपकी लोकेशन केवल तभी जांचता है जब आप स्पष्ट रूप से “मेरे पास” या “मेरा स्थान उपयोग करें” पर क्लिक करते हैं। सभी स्वास्थ्य सुझाव केवल सामान्य जानकारी के लिए हैं।',

  signInTitle: 'BreatheWell में साइन इन करें',
  signUpTitle: 'नया BreatheWell खाता बनाएं',
  authSubtitle:
    'पसंदीदा भारतीय शहर सहेजें, खोज इतिहास देखें और अपनी AQI चेतावनी सीमा तय करें।',
  signUp: 'साइन अप',
  fullName: 'पूरा नाम',
  emailAddress: 'ईमेल पता',
  password: 'पासवर्ड',
  passwordPlaceholder: 'कम से कम 8 अक्षर',
  pleaseWait: 'कृपया प्रतीक्षा करें...',
  createAccount: 'खाता बनाएं',
  demoLoginBtn: 'डेमो प्रोफ़ाइल से साइन इन करें (Aarav Sharma)',
  authNameError: 'कृपया अपना नाम दर्ज करें (कम से कम 2 अक्षर)।',
  authEmailError: 'कृपया एक मान्य ईमेल पता दर्ज करें।',
  authPasswordError: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।',

  demoProfileTag: 'डेमो प्रोफ़ाइल',
  notificationSettings: 'नोटिफिकेशन सेटिंग्स',
  browserAlertsTitle: 'पसंदीदा शहर ब्राउज़र अलर्ट',
  browserAlertsDesc:
    'जब भी आपका कोई पसंदीदा शहर आपकी AQI सीमा से ऊपर जाए तो तुरंत ब्राउज़र अलर्ट पाएं।',
  permGranted: 'ब्राउज़र अनुमति स्वीकृत है',
  permDenied: 'ब्राउज़र सेटिंग्स में ब्लॉक (ऐप के भीतर अलर्ट सक्रिय)',
  permDefault: 'चालू करने पर ब्राउज़र अनुमति मांगी जाएगी',
  permUnsupported: 'ब्राउज़र नोटिफिकेशन उपलब्ध नहीं (ऐप के भीतर अलर्ट सक्रिय)',
  personalThreshold: 'व्यक्तिगत AQI चेतावनी सीमा',
  alertsPausedText: 'पसंदीदा शहर के ब्राउज़र अलर्ट अभी रुके हुए हैं।',
  saveCityMonitorPrompt: 'अपनी सीमा से तुलना करने के लिए नीचे किसी पसंदीदा शहर को सहेजें।',
  sendTestAlert: 'टेस्ट अलर्ट भेजें',
  testDispatched: 'ब्राउज़र नोटिफिकेशन भेज दिया गया।',
  testBlockedPreview: 'ब्राउज़र पॉपअप ब्लॉक हैं; ऐप के भीतर अलर्ट पूर्वावलोकन दिखाया गया।',
  testInAppPreview: 'ऐप के भीतर पसंदीदा-शहर अलर्ट दिखाया गया।',
  defaultHealthProfile: 'डिफ़ॉल्ट स्वास्थ्य प्रोफ़ाइल',
  savedFavoriteCities: 'सहेजे गए पसंदीदा शहर',
  noSavedCities: 'अभी कोई शहर सहेजा नहीं गया है। किसी भी डैशबोर्ड पर “शहर सहेजें” दबाएं।',
  abovePrefix: 'अधिक:',
  recentSearches: 'हाल की खोजें',
  clear: 'साफ़ करें',
  noRecentSearches: 'साइन इन रहने पर देखे गए शहर यहाँ दिखाई देंगे।',
  signOut: 'साइन आउट',
  favoriteAlertTitle: 'पसंदीदा शहर AQI अलर्ट',

  footerDesc:
    'शहरी वायु गुणवत्ता सहायता जो नागरिकों को रीयल-टाइम डेटा समझने, शहरों की तुलना करने और स्वस्थ दिनचर्या चुनने में मदद करती है।',
  footerDisclaimer: 'वायु गुणवत्ता सलाह केवल जानकारी के लिए है और डॉक्टर की सलाह का विकल्प नहीं है।',
  platformHeading: 'प्लेटफ़ॉर्म',
  guidanceHeading: 'मार्गदर्शन',
  displayLinksHeading: 'प्रदर्शन और लिंक',
  liveAqiDashboardLink: 'लाइव AQI डैशबोर्ड',
  interactiveCityMapLink: 'इंटरैक्टिव शहर मानचित्र',
  trendsComparisonLink: 'रुझान और तुलना',
  breatheAiAssistantLink: 'BreatheAI सहायक',
  methodologySourcesLink: 'कार्यप्रणाली और स्रोत',
  footerCopyright: '© 2026 BreatheWell शहरी वायु गुणवत्ता सहायता।',
  footerDataAttr: 'डेटा: Open-Meteo CAMS, OpenAQ रजिस्ट्री व CPCB NAQI मानक।',

  gpsBlockedNotice: (name, state) =>
    `ब्राउज़र GPS अनुमति बंद थी; अनुमानित नेटवर्क स्थान (${name}, ${state}) का लाइव AQI दिखाया जा रहा है।`,
  gpsUnavailableNotice: (name, state) =>
    `GPS निर्देशांक उपलब्ध नहीं थे; अनुमानित नेटवर्क स्थान (${name}, ${state}) का लाइव AQI दिखाया जा रहा है।`,
  locationDeclinedError:
    'लोकेशन अनुमति अस्वीकार कर दी गई और स्वतः पहचान विफल रही। कृपया ऊपर अपना शहर मैन्युअल रूप से खोजें।',
  locationUnavailableError:
    'आपकी लोकेशन स्वतः पता नहीं चल सकी। कृपया ऊपर अपना शहर मैन्युअल रूप से खोजें।',
};

const AQI_STATUS_HI: Record<AQIStatusLabel, string> = {
  Good: 'अच्छा',
  Satisfactory: 'संतोषजनक',
  Moderate: 'मध्यम',
  Poor: 'खराब',
  'Very Poor': 'बहुत खराब',
  Severe: 'गंभीर',
};

export function translateAQIStatus(status: AQIStatusLabel, lang: Language): string {
  return lang === 'hi' ? AQI_STATUS_HI[status] ?? status : status;
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: EN,
});

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem('breathewell_lang');
    if (saved === 'hi' || saved === 'en') return saved;
  } catch {
    // Ignore storage restriction
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem('breathewell_lang', next);
    } catch {
      // Ignore storage restriction
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => setLang(lang === 'en' ? 'hi' : 'en');

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t: lang === 'hi' ? HI : EN,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
