import type {
  AirQualityPayload,
  AQIStatusLabel,
  DemographicGroup,
  HealthGuidanceCard,
  HistoryPoint,
  PollutantReadings,
} from '../types.ts';

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

// Official Indian National Air Quality Index (CPCB NAQI) breakpoints
const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 30.1, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 60.1, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 90.1, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 120.1, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 250.1, cHigh: 500, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 50.1, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 100.1, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 250.1, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 350.1, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 430.1, cHigh: 650, iLow: 401, iHigh: 500 },
];

const NO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 40.1, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 80.1, cHigh: 180, iLow: 101, iHigh: 200 },
  { cLow: 180.1, cHigh: 280, iLow: 201, iHigh: 300 },
  { cLow: 280.1, cHigh: 400, iLow: 301, iHigh: 400 },
  { cLow: 400.1, cHigh: 600, iLow: 401, iHigh: 500 },
];

const SO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 40.1, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 80.1, cHigh: 380, iLow: 101, iHigh: 200 },
  { cLow: 380.1, cHigh: 800, iLow: 201, iHigh: 300 },
  { cLow: 800.1, cHigh: 1600, iLow: 301, iHigh: 400 },
  { cLow: 1600.1, cHigh: 2000, iLow: 401, iHigh: 500 },
];

const CO_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 1.0, iLow: 0, iHigh: 50 },
  { cLow: 1.01, cHigh: 2.0, iLow: 51, iHigh: 100 },
  { cLow: 2.01, cHigh: 10.0, iLow: 101, iHigh: 200 },
  { cLow: 10.01, cHigh: 17.0, iLow: 201, iHigh: 300 },
  { cLow: 17.01, cHigh: 34.0, iLow: 301, iHigh: 400 },
  { cLow: 34.01, cHigh: 50.0, iLow: 401, iHigh: 500 },
];

const O3_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 50.1, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 100.1, cHigh: 168, iLow: 101, iHigh: 200 },
  { cLow: 168.1, cHigh: 208, iLow: 201, iHigh: 300 },
  { cLow: 208.1, cHigh: 748, iLow: 301, iHigh: 400 },
  { cLow: 748.1, cHigh: 1000, iLow: 401, iHigh: 500 },
];

export function computeSubIndex(value: number | null, breakpoints: Breakpoint[]): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  for (const bp of breakpoints) {
    if (value <= bp.cHigh) {
      const ratio = (value - bp.cLow) / (bp.cHigh - bp.cLow || 1);
      return Math.round(bp.iLow + ratio * (bp.iHigh - bp.iLow));
    }
  }
  return 500;
}

export function calculateIndianAQI(pollutants: Partial<PollutantReadings>): {
  aqi: number;
  dominantPollutant: string;
} {
  const candidates: { label: string; score: number | null }[] = [
    { label: 'PM2.5', score: computeSubIndex(pollutants.pm25 ?? null, PM25_BREAKPOINTS) },
    { label: 'PM10', score: computeSubIndex(pollutants.pm10 ?? null, PM10_BREAKPOINTS) },
    { label: 'NO2', score: computeSubIndex(pollutants.no2 ?? null, NO2_BREAKPOINTS) },
    { label: 'SO2', score: computeSubIndex(pollutants.so2 ?? null, SO2_BREAKPOINTS) },
    { label: 'CO', score: computeSubIndex(pollutants.co ?? null, CO_BREAKPOINTS) },
    { label: 'O3', score: computeSubIndex(pollutants.o3 ?? null, O3_BREAKPOINTS) },
  ];

  let maxScore = 0;
  let dominant = 'PM2.5';

  for (const item of candidates) {
    if (item.score !== null && item.score >= maxScore) {
      maxScore = item.score;
      dominant = item.label;
    }
  }

  return {
    aqi: Math.max(1, Math.min(500, maxScore || 35)),
    dominantPollutant: dominant,
  };
}

export interface AQICategoryMeta {
  label: AQIStatusLabel;
  range: string;
  hex: string;
  textClass: string;
  bgSoftClass: string;
  borderClass: string;
  dotClass: string;
  summary: string;
}

export function getAQICategory(aqi: number, lang: 'en' | 'hi' = 'en'): AQICategoryMeta {
  const value = Math.max(0, Math.round(aqi));
  const isHi = lang === 'hi';
  if (value <= 50) {
    return {
      label: 'Good',
      range: '0–50',
      hex: '#10B981',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      bgSoftClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      summary: isHi
        ? 'न्यूनतम स्वास्थ्य प्रभाव। बाहरी व्यायाम और खिड़कियां खोलने के लिए उत्तम हवा।'
        : 'Minimal health impact. Ideal conditions for outdoor exercise and open ventilation.',
    };
  }
  if (value <= 100) {
    return {
      label: 'Satisfactory',
      range: '51–100',
      hex: '#22C55E',
      textClass: 'text-green-700 dark:text-green-300',
      bgSoftClass: 'bg-green-500/10',
      borderClass: 'border-green-500/30',
      dotClass: 'bg-green-500',
      summary: isHi
        ? 'संतोषजनक वायु गुणवत्ता। संवेदनशील लोगों को हल्की सांस की असुविधा हो सकती है।'
        : 'Acceptable air quality. Sensitive individuals may experience minor breathing discomfort.',
    };
  }
  if (value <= 200) {
    return {
      label: 'Moderate',
      range: '101–200',
      hex: '#F59E0B',
      textClass: 'text-amber-700 dark:text-amber-300',
      bgSoftClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/30',
      dotClass: 'bg-amber-500',
      summary: isHi
        ? 'बच्चों, बुजुर्गों और अस्थमा या हृदय रोगियों को सांस लेने में परेशानी हो सकती है।'
        : 'Breathing discomfort possible for children, seniors, and people with asthma or heart conditions.',
    };
  }
  if (value <= 300) {
    return {
      label: 'Poor',
      range: '201–300',
      hex: '#F97316',
      textClass: 'text-orange-700 dark:text-orange-300',
      bgSoftClass: 'bg-orange-500/10',
      borderClass: 'border-orange-500/30',
      dotClass: 'bg-orange-500',
      summary: isHi
        ? 'लंबे समय तक बाहर रहने पर अधिकांश लोगों को सांस लेने में असुविधा हो सकती है।'
        : 'Prolonged outdoor exposure can cause breathing discomfort for most residents.',
    };
  }
  if (value <= 400) {
    return {
      label: 'Very Poor',
      range: '301–400',
      hex: '#EF4444',
      textClass: 'text-red-700 dark:text-red-300',
      bgSoftClass: 'bg-red-500/10',
      borderClass: 'border-red-500/30',
      dotClass: 'bg-red-500',
      summary: isHi
        ? 'लंबे समय तक संपर्क से श्वसन में जलन संभव है। बाहर भारी मेहनत कम करें।'
        : 'Respiratory irritation likely on prolonged exposure. Minimize outdoor exertion.',
    };
  }
  return {
    label: 'Severe',
    range: '401–500',
    hex: '#991B1B',
    textClass: 'text-rose-800 dark:text-rose-300',
    bgSoftClass: 'bg-rose-600/15',
    borderClass: 'border-rose-600/35',
    dotClass: 'bg-rose-700',
    summary: isHi
      ? 'सभी के लिए उच्च जोखिम। फ़िल्टर्ड हवा वाले कमरे में रहें और बाहर व्यायाम से बचें।'
      : 'High exposure risk for everyone. Stay indoors with filtered air and avoid physical exertion outside.',
  };
}

export function getHealthRecommendations(
  aqi: number,
  group: DemographicGroup = 'general',
  lang: 'en' | 'hi' = 'en'
): HealthGuidanceCard {
  const highRisk = aqi > 200;
  const moderateRisk = aqi > 100 && aqi <= 200;
  const severeRisk = aqi > 300;
  const isHi = lang === 'hi';

  const baseTitles: Record<DemographicGroup, string> = isHi
    ? {
        general: 'सामान्य नागरिक',
        children: 'बच्चे और किशोर',
        seniors: 'वरिष्ठ नागरिक (65+)',
        outdoor_workers: 'बाहरी कामगार व यात्री',
        respiratory: 'श्वसन संवेदनशीलता',
      }
    : {
        general: 'General Population',
        children: 'Children & Adolescents',
        seniors: 'Senior Citizens (65+)',
        outdoor_workers: 'Outdoor Workers & Commuters',
        respiratory: 'Respiratory Sensitivities',
      };

  if (isHi) {
    if (group === 'children') {
      return {
        group,
        title: baseTitles[group],
        summary: severeRisk
          ? 'अधिक कण प्रदूषण के कारण स्कूल खेल और बाहरी गतिविधियां आज घर के अंदर ही रखें।'
          : highRisk
            ? 'तेज बाहरी खेल सीमित रखें; इनडोर गतिविधियां या दोपहर के छोटे ब्रेक चुनें।'
            : moderateRisk
              ? 'पानी के ब्रेक के साथ सामान्य खेल ठीक है; मुख्य सड़कों के ट्रैफिक से दूर रहें।'
              : 'बाहरी खेल, साइकिलिंग और पार्क की गतिविधियों के लिए हवा बहुत अच्छी है।',
        outdoorActivity: severeRisk
          ? 'बाहरी खेल रद्द करें और बच्चों को अंदर ही रखें।'
          : highRisk
            ? 'मुख्य सड़कों से दूर बाहरी खेल 20 मिनट से कम रखें।'
            : 'सामान्य बाहरी खेल सुरक्षित हैं; खांसी पर ध्यान रखें।',
        maskAndVentilation: highRisk
          ? 'ट्रैफिक के पास फिट होने वाला बच्चों का KN95/N95 मास्क लगाएं; कक्षा में HEPA प्यूरीफायर चलाएं।'
          : 'दोपहर में हल्की हवा चलने पर प्राकृतिक वेंटिलेशन सुरक्षित है।',
        exerciseSuggestion: highRisk
          ? 'इनडोर स्ट्रेचिंग, योग या इनडोर कोर्ट खेल।'
          : 'पार्क के हरे क्षेत्रों में दौड़ना, फुटबॉल या साइकिलिंग।',
        precautions: [
          'सुबह और शाम के व्यस्त ट्रैफिक समय में बाहर खेलने से बचें।',
          'वायुमार्ग को नमी देने के लिए बार-बार पानी पिलाएं।',
          'खेल के बाद थकान या गले में खराश पर ध्यान दें।',
        ],
      };
    }

    if (group === 'seniors') {
      return {
        group,
        title: baseTitles[group],
        summary: severeRisk
          ? 'खिड़कियां बंद रखें और साफ इनडोर हवा में घर के भीतर रहें।'
          : highRisk
            ? 'सुबह की सैर टालें; घर के अंदर हल्का व्यायाम चुनें।'
            : moderateRisk
              ? 'भीड़भाड़ वाली सड़कों के बजाय हरे पार्क में छोटी और धीमी सैर बेहतर है।'
              : 'सुबह की सैर और बाहरी सामुदायिक गतिविधियों के लिए सुरक्षित स्थिति है।',
        outdoorActivity: severeRisk
          ? 'अति आवश्यक न हो तो बाहर न निकलें।'
          : highRisk
            ? 'संक्षिप्त सैर के लिए दोपहर (13:00–16:00) का समय चुनें।'
            : 'नियमित सैर का समय उपयुक्त है।',
        maskAndVentilation: highRisk
          ? 'सुबह के धुंध के समय खिड़कियां बंद रखें; बाहर निकलते समय आरामदायक N95 मास्क पहनें।'
          : 'दोपहर में हवा की गति बढ़ने पर थोड़ी देर क्रॉस-वेंटिलेशन करें।',
        exerciseSuggestion: highRisk
          ? 'चेयर योग, घर के अंदर हल्की चहलकदमी या प्राणायाम।'
          : 'पार्क में तेज सैर या छायादार क्षेत्रों में हल्का व्यायाम।',
        precautions: [
          'निर्धारित इनहेलर या नियमित दवाएं हमेशा पास रखें।',
          'आज घर के अंदर अगरबत्ती, मोमबत्ती या धुएं के स्रोत न जलाएं।',
          'सुबह बाहर निकलने से पहले स्थानीय AQI जरूर देखें।',
        ],
      };
    }

    if (group === 'outdoor_workers') {
      return {
        group,
        title: baseTitles[group],
        summary: severeRisk
          ? 'उच्च जोखिम स्थिति। N95 सुरक्षा अनिवार्य रखें और इनडोर विश्राम ब्रेक लें।'
          : highRisk
            ? 'शिफ्ट के दौरान प्रमाणित N95/FFP2 मास्क पहनें और बार-बार पानी पिएं।'
            : moderateRisk
              ? 'मुख्य सड़कों और निर्माण स्थलों के पास सुरक्षात्मक मास्क पहनें।'
              : 'बाहरी फील्ड कार्य के लिए अनुकूल वायु स्थिति है।',
        outdoorActivity: severeRisk
          ? 'भारी शारीरिक काम को छोटे अंतराल में बांटें और छाया/अंदर आराम करें।'
          : 'नियमित हाइड्रेशन ब्रेक के साथ सामान्य कार्य गति रखें।',
        maskAndVentilation: highRisk
          ? 'सही फिटिंग वाला N95/FFP2 मास्क पहनें (गीला होने पर बदलें); केवल कपड़े का मास्क PM2.5 नहीं रोकता।'
          : 'डीजल धुएं या धूल के पास काम करते समय मास्क साथ रखें।',
        exerciseSuggestion: highRisk
          ? 'अनावश्यक शारीरिक थकान बचाएं; शिफ्ट के बाद अंदर स्ट्रेचिंग करें।'
          : 'शिफ्ट के बाद कम ट्रैफिक वाले क्षेत्र में हल्की सैर।',
        precautions: [
          'धूल भरी शिफ्ट के बाद साफ पानी से चेहरा और नाक धोएं।',
          'खड़े वाहनों के धुएं से दूर बंद केबिन या छाया में ब्रेक लें।',
          'तेज हवा वाले दोपहर के घंटों में भारी काम निपटाने का प्रयास करें।',
        ],
      };
    }

    if (group === 'respiratory') {
      return {
        group,
        title: baseTitles[group],
        summary: severeRisk
          ? 'अधिक कण श्वसन नली में सूजन बढ़ा सकते हैं। एयर फ़िल्टर के साथ अंदर रहें।'
          : highRisk
            ? 'बाहर जाना न्यूनतम रखें; रिलीवर दवा पास रखें और HEPA एयर प्यूरीफायर चलाएं।'
            : moderateRisk
              ? 'इनडोर व्यायाम चुनें और धूल या धुएं वाले स्थानों से बचें।'
              : 'आरामदायक सांस लेने के लिए वायु गुणवत्ता अनुकूल है।',
        outdoorActivity: severeRisk
          ? 'घर के अंदर रहें; अनावश्यक बाहरी यात्रा स्थगित करें।'
          : highRisk
            ? 'जरूरी कामों के लिए बाहर का समय 15–20 मिनट से कम रखें।'
            : 'मध्यम बाहरी गतिविधि सामान्यतः आरामदायक है; अपनी गति संतुलित रखें।',
        maskAndVentilation: highRisk
          ? 'बाहर अच्छी तरह सील होने वाला N95/N99 मास्क पहनें; खिड़कियां बंद कर HEPA फ़िल्टर चलाएं।'
          : 'तभी खिड़की खोलें जब बाहर का AQI अंदर से कम हो।',
        exerciseSuggestion: highRisk
          ? 'फ़िल्टर्ड कमरे में हल्की स्ट्रेचिंग या स्टेशनरी साइकिलिंग।'
          : 'मुख्य चौराहों से दूर हल्की सैर।',
        precautions: [
          'निर्धारित एक्शन प्लान और रिलीवर इनहेलर हमेशा पास रखें।',
          'रसोई में तलने-भूनने के धुएं से बचें और एग्जॉस्ट फैन चालू रखें।',
          'लगातार घरघराहट या सीने में जकड़न महसूस हो तो चिकित्सक से सलाह लें।',
        ],
      };
    }

    return {
      group: 'general',
      title: baseTitles.general,
      summary: severeRisk
        ? 'वायु प्रदूषण गंभीर स्तर पर है। घर के अंदर रहें, एयर फ़िल्टर उपयोग करें और यात्रा में N95 पहनें।'
        : highRisk
          ? 'लंबे या कठिन बाहरी व्यायाम कम करें और इनडोर वर्कआउट चुनें।'
          : moderateRisk
            ? 'दैनिक कार्यों के लिए ठीक है, लेकिन तेज कार्डियो हवा चलने पर करना बेहतर होगा।'
            : 'स्वच्छ, ताज़ा हवा — बाहरी फिटनेस और खिड़कियां खोलने के लिए बेहतरीन समय।',
      outdoorActivity: severeRisk
        ? 'लंबे समय तक बाहर रहने और भारी मेहनत से बचें।'
        : highRisk
          ? 'बाहरी कार्डियो छोटा रखें; दोपहर की साफ हवा वाले समय को प्राथमिकता दें।'
          : 'अधिकांश लोगों के लिए सभी बाहरी गतिविधियां आरामदायक हैं।',
      maskAndVentilation: highRisk
        ? 'यात्रा के दौरान N95/FFP2 मास्क पहनें; पीक ट्रैफिक के समय खिड़कियां बंद रखें।'
        : 'तेज हवा चलने पर ताज़ी हवा के लिए खिड़कियां खोलें।',
      exerciseSuggestion: highRisk
        ? 'तेज दौड़ या HIIT सत्र को इनडोर जिम में शिफ्ट करें।'
        : 'पार्क में दौड़ना, साइकिलिंग और बाहरी व्यायाम आज बिल्कुल उपयुक्त हैं।',
      precautions: [
        'आवागमन के लिए व्यस्त मुख्य सड़कों के बजाय हरित पार्क मार्ग चुनें।',
        'शाम के बाहरी कार्यक्रमों से पहले प्रति-घंटा AQI बदलाव देखें।',
        'यह केवल सामान्य जानकारी है — चिकित्सीय निदान नहीं।',
      ],
    };
  }

  if (group === 'children') {
    return {
      group,
      title: baseTitles[group],
      summary: severeRisk
        ? 'Keep school sports and outdoor play indoors today due to elevated particulate burden.'
        : highRisk
          ? 'Limit vigorous outdoor play; favor indoor classrooms or short midday breaks.'
          : moderateRisk
            ? 'Normal outdoor play is fine with hydration breaks; avoid heavy roadside traffic.'
            : 'Great air for outdoor sports, recess, and cycling.',
      outdoorActivity: severeRisk
        ? 'Cancel outdoor sports and keep recess indoors.'
        : highRisk
          ? 'Keep outdoor sessions under 20 minutes away from main roads.'
          : 'Normal outdoor activity permitted; monitor for coughing.',
      maskAndVentilation: highRisk
        ? 'Use a snug child-sized KN95/N95 mask near traffic; run classroom HEPA purifiers.'
        : 'Natural ventilation is safe during breezy afternoon hours.',
      exerciseSuggestion: highRisk
        ? 'Indoor stretching, yoga, or indoor court activities.'
        : 'Outdoor running, football, or cycling in park greenbelts.',
      precautions: [
        'Schedule play away from peak morning/evening commuter traffic.',
        'Encourage frequent water intake to keep airways hydrated.',
        'Watch for unusual fatigue or throat irritation after play.',
      ],
    };
  }

  if (group === 'seniors') {
    return {
      group,
      title: baseTitles[group],
      summary: severeRisk
        ? 'Remain indoors with windows sealed and clean indoor air circulation.'
        : highRisk
          ? 'Postpone early-morning walks; opt for gentle indoor mobility.'
          : moderateRisk
            ? 'Short, low-intensity walks in green parks are preferable over busy streets.'
            : 'Safe conditions for morning walks and outdoor community activities.',
      outdoorActivity: severeRisk
        ? 'Avoid outdoor errands unless essential.'
        : highRisk
          ? 'Wait until afternoon dispersion (13:00–16:00) for brief walks.'
          : 'Regular walking schedule is suitable.',
      maskAndVentilation: highRisk
        ? 'Keep windows closed during morning haze; wear a comfortable N95 respirator outdoors.'
        : 'Cross-ventilate home briefly around midday when wind speeds rise.',
      exerciseSuggestion: highRisk
        ? 'Chair yoga, gentle indoor walking, or breathing exercises.'
        : 'Brisk park walks or tai chi in shaded green areas.',
      precautions: [
        'Keep routine prescribed inhalers or medications accessible.',
        'Avoid lighting incense, candles, or indoor smoke sources today.',
        'Check local AQI before stepping out for early-morning routines.',
      ],
    };
  }

  if (group === 'outdoor_workers') {
    return {
      group,
      title: baseTitles[group],
      summary: severeRisk
        ? 'High occupational exposure risk. Mandate respiratory protection and rotate indoor rest breaks.'
        : highRisk
          ? 'Wear a certified N95/FFP2 respirator during shifts and hydrate frequently.'
          : moderateRisk
            ? 'Use protective masks along arterial roads and construction zones.'
            : 'Favorable air conditions for outdoor field shifts.',
      outdoorActivity: severeRisk
        ? 'Rotate heavy physical tasks into shorter intervals with shaded/indoor rest.'
        : 'Standard shift pacing with scheduled hydration stops.',
      maskAndVentilation: highRisk
        ? 'Fit-checked N95/FFP2 mask (replace when damp or soiled); avoid cloth-only masks for PM2.5.'
        : 'Keep mask handy when working near diesel exhaust or dust plumes.',
      exerciseSuggestion: highRisk
        ? 'Conserve cardiopulmonary effort; stretch indoors post-shift.'
        : 'Normal post-shift recovery walks in low-traffic zones.',
      precautions: [
        'Rinse face and nasal passages with clean water after dusty shifts.',
        'Take breaks inside enclosed cabins or shaded courtyards away from idling vehicles.',
        'Coordinate heavy tasks during higher wind dispersion hours.',
      ],
    };
  }

  if (group === 'respiratory') {
    return {
      group,
      title: baseTitles[group],
      summary: severeRisk
        ? 'Elevated particulate matter can trigger airway inflammation. Stay indoors with air filtration.'
        : highRisk
          ? 'Minimize outdoor exposure; keep rescue medication handy and run HEPA air purification.'
          : moderateRisk
            ? 'Prefer indoor workouts and avoid areas with visible dust or smoke.'
            : 'Air quality is supportive of comfortable outdoor breathing.',
      outdoorActivity: severeRisk
        ? 'Stay indoors; postpone non-essential outdoor travel.'
        : highRisk
          ? 'Limit outdoor time to essential errands under 15–20 minutes.'
          : 'Moderate outdoor activity is generally comfortable; pace yourself.',
      maskAndVentilation: highRisk
        ? 'Wear a well-sealed N95/N99 mask outdoors; seal window gaps and run HEPA filtration on medium/high.'
        : 'Ventilate indoors only when outdoor AQI is lower than indoor levels.',
      exerciseSuggestion: highRisk
        ? 'Low-impact indoor stretching or stationary cycling inside filtered spaces.'
        : 'Light outdoor walks away from major intersections.',
      precautions: [
        'Keep prescribed action plans and reliever inhalers close at hand.',
        'Avoid kitchen frying smoke; always run exhaust hoods while cooking.',
        'Consult a licensed clinician if you experience persistent wheezing or chest tightness.',
      ],
    };
  }

  return {
    group: 'general',
    title: baseTitles.general,
    summary: severeRisk
      ? 'Air pollution is at severe levels. Prioritize indoor time, filtration, and N95 protection if commuting.'
      : highRisk
        ? 'Reduce prolonged or vigorous outdoor exertion and switch workouts indoors.'
        : moderateRisk
          ? 'Acceptable for daily routines, though intense cardio is better timed when wind picks up.'
          : 'Clean, refreshing urban air — ideal for outdoor fitness and open-window ventilation.',
    outdoorActivity: severeRisk
      ? 'Avoid prolonged outdoor stays and heavy exertion.'
      : highRisk
        ? 'Shorten outdoor cardio sessions; prefer morning/afternoon dispersion windows.'
        : 'Full outdoor routines are comfortable for most people.',
    maskAndVentilation: highRisk
      ? 'Use N95/FFP2 masks during commutes; keep windows closed during peak traffic.'
      : 'Open windows for fresh cross-ventilation during breezy hours.',
    exerciseSuggestion: highRisk
      ? 'Move high-intensity runs or HIIT sessions to an indoor gym.'
      : 'Outdoor running, cycling, and park workouts are well-suited today.',
    precautions: [
      'Choose green park corridors over high-traffic arterial roads for commuting.',
      'Monitor hourly AQI shifts before planning evening outdoor events.',
      'Informational guidance only — not a medical diagnosis.',
    ],
  };
}

function seededHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function buildDeterministicHistory(
  cityId: string,
  baseAqi: number,
  basePm25: number,
  basePm10: number,
  range: '24h' | '7d' | '30d',
  now: Date = new Date()
): HistoryPoint[] {
  const seed = seededHash(cityId);
  const points: HistoryPoint[] = [];

  if (range === '24h') {
    for (let i = 23; i >= 0; i -= 1) {
      const ts = new Date(now.getTime() - i * 3600 * 1000);
      const hour = ts.getHours();
      // Realistic urban diurnal curve: morning rush (7-10) & evening inversion (19-23) higher, afternoon (13-16) lower
      const diurnal =
        hour >= 7 && hour <= 10
          ? 1.12
          : hour >= 13 && hour <= 16
            ? 0.84
            : hour >= 19 && hour <= 23
              ? 1.18
              : 0.96;
      const wave = 1 + (Math.sin((seed + i) * 0.7) * 0.08);
      const factor = diurnal * wave;
      points.push({
        label: `${String(hour).padStart(2, '0')}:00`,
        timestamp: ts.toISOString(),
        aqi: Math.max(8, Math.min(495, Math.round(baseAqi * factor))),
        pm25: Math.max(4, Math.round(basePm25 * factor)),
        pm10: Math.max(8, Math.round(basePm10 * factor)),
      });
    }
    return points;
  }

  const days = range === '7d' ? 7 : 30;
  for (let i = days - 1; i >= 0; i -= 1) {
    const ts = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const wave = 1 + Math.sin((seed % 17) + i * 0.65) * 0.16 + Math.cos(i * 0.3) * 0.06;
    const monthDay = ts.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    points.push({
      label: monthDay,
      timestamp: ts.toISOString(),
      aqi: Math.max(10, Math.min(490, Math.round(baseAqi * wave))),
      pm25: Math.max(5, Math.round(basePm25 * wave)),
      pm10: Math.max(10, Math.round(basePm10 * wave)),
    });
  }
  return points;
}

function escapeCsvCell(val: string | number | null): string {
  const s = val === null || val === undefined ? 'Unavailable' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function formatCSVReport(payload: AirQualityPayload): string {
  const rows: (string | number | null)[][] = [
    ['BreatheWell Air Quality Report'],
    ['City', payload.city.name, 'State', payload.city.state],
    ['Data Source', payload.dataSource, 'Data Mode', payload.dataMode],
    ['Last Updated', payload.lastUpdated],
    ['Overall AQI (CPCB NAQI)', payload.aqi, 'Status', payload.status],
    ['Dominant Pollutant', payload.dominantPollutant],
    [],
    ['Pollutant / Metric', 'Value', 'Unit'],
    ['PM2.5', payload.pollutants.pm25, 'µg/m³'],
    ['PM10', payload.pollutants.pm10, 'µg/m³'],
    ['NO2', payload.pollutants.no2, 'µg/m³'],
    ['SO2', payload.pollutants.so2, 'µg/m³'],
    ['CO', payload.pollutants.co, 'mg/m³'],
    ['O3', payload.pollutants.o3, 'µg/m³'],
    ['Temperature', payload.weather.temperature, '°C'],
    ['Humidity', payload.weather.humidity, '%'],
    ['Wind Speed', payload.weather.windSpeed, 'km/h'],
  ];
  return rows.map((r) => r.map(escapeCsvCell).join(',')).join('\n');
}

export function formatTextSummary(payload: AirQualityPayload): string {
  const pm25Text = payload.pollutants.pm25 !== null ? `${payload.pollutants.pm25} µg/m³` : 'Unavailable';
  const pm10Text = payload.pollutants.pm10 !== null ? `${payload.pollutants.pm10} µg/m³` : 'Unavailable';
  return `${payload.city.name}, ${payload.city.state} — AQI ${payload.aqi} (${payload.status}) | PM2.5: ${pm25Text} · PM10: ${pm10Text} | Source: ${payload.dataSource} (${payload.dataMode}). Checked via BreatheWell.`;
}

export function findExceededFavoriteCities<
  T extends { id: string; name: string; aqi: number; status: string }
>(cities: T[], favoriteIds: string[], thresholdAqi: number): T[] {
  const favSet = new Set(favoriteIds);
  return cities
    .filter((c) => favSet.has(c.id) && c.aqi >= thresholdAqi)
    .sort((a, b) => b.aqi - a.aqi);
}

export function buildFavoriteAlertBody(
  exceeded: Array<{ name: string; aqi: number; status: string }>,
  thresholdAqi: number,
  lang: 'en' | 'hi' = 'en'
): string {
  if (lang === 'hi') {
    if (exceeded.length === 0) {
      return `सभी पसंदीदा शहर अभी आपकी ${thresholdAqi} AQI सीमा से नीचे हैं।`;
    }
    if (exceeded.length === 1) {
      const c = exceeded[0];
      return `${c.name} अभी AQI ${c.aqi} पर है, जो आपकी ${thresholdAqi} AQI सीमा से अधिक है।`;
    }
    const summary = exceeded
      .slice(0, 3)
      .map((c) => `${c.name} (${c.aqi})`)
      .join(', ');
    const extra = exceeded.length > 3 ? ` +${exceeded.length - 3} अन्य` : '';
    return `${summary}${extra} आपकी ${thresholdAqi} AQI सीमा से ऊपर हैं।`;
  }

  if (exceeded.length === 0) {
    return `All favorite cities are currently below your ${thresholdAqi} AQI threshold.`;
  }
  if (exceeded.length === 1) {
    const c = exceeded[0];
    return `${c.name} is at AQI ${c.aqi} (${c.status}), exceeding your ${thresholdAqi} AQI threshold.`;
  }
  const summary = exceeded
    .slice(0, 3)
    .map((c) => `${c.name} (${c.aqi})`)
    .join(', ');
  const extra = exceeded.length > 3 ? ` +${exceeded.length - 3} more` : '';
  return `${summary}${extra} exceed your ${thresholdAqi} AQI threshold.`;
}

