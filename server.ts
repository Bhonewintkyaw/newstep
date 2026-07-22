import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'First Step (ခြေလှမ်းသစ်)' });
});

type VoiceAction = 'RECORD_SALE' | 'RECORD_PURCHASE' | 'CHECK_LOAN' | 'CHECK_WEATHER' | 'INVENTORY_INQUIRY' | 'GENERAL_QUERY';

interface VoiceResult {
  action: VoiceAction;
  itemName?: string;
  quantity?: string | number;
  amount?: number;
  replyBurmese: string;
  replyEnglish: string;
}

const voiceActions = new Set<VoiceAction>([
  'RECORD_SALE', 'RECORD_PURCHASE', 'CHECK_LOAN', 'CHECK_WEATHER', 'INVENTORY_INQUIRY', 'GENERAL_QUERY',
]);

const normalizeMyanmarDigits = (value: string) => value.replace(/[၀-၉]/g, (digit) => String('၀၁၂၃၄၅၆၇၈၉'.indexOf(digit)));

function extractExplicitAmount(transcript: string): number | undefined {
  const normalized = normalizeMyanmarDigits(transcript);
  const currencyAmount = normalized.match(/([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:ကျပ်|kyats?|mmk|ks\.?)/i);
  const englishTotal = normalized.match(/(?:for|total|amount|price)\s*[:=-]?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i);
  const match = currencyAmount || englishTotal;
  if (!match) return undefined;
  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) && amount > 0 && amount <= 1_000_000_000_000 ? Math.round(amount) : undefined;
}

function extractItemName(transcript: string): string {
  const cleaned = normalizeMyanmarDigits(transcript)
    .replace(/([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:ကျပ်|kyats?|mmk|ks\.?)/gi, '')
    .replace(/(?:for|total|amount|price)\s*[:=-]?\s*[0-9][0-9,]*(?:\.[0-9]+)?/gi, '')
    .replace(/\b(?:sold|sell|sale|bought|buy|purchase|record|log)\b/gi, '')
    .replace(/\b(?:for|total|amount|price)\b/gi, '')
    .replace(/(?:ရောင်းခဲ့သည်|ရောင်းသည်|ရောင်း|ဝယ်ယူခဲ့သည်|ဝယ်ယူသည်|ဝယ်ယူ|ဝယ်)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, 120);
}

function parseVoiceCommand(transcript: string): VoiceResult {
  const lower = transcript.toLowerCase();
  const isSale = /\b(sold|sell|sale)\b/i.test(lower) || transcript.includes('ရောင်း');
  const isPurchase = /\b(bought|buy|purchase)\b/i.test(lower) || transcript.includes('ဝယ်');

  if (isSale || isPurchase) {
    const amount = extractExplicitAmount(transcript);
    if (!amount) {
      return {
        action: 'GENERAL_QUERY',
        replyBurmese: 'စာရင်းမသွင်းရသေးပါ။ ပစ္စည်းအမည်နှင့် စုစုပေါင်းငွေပမာဏကို ကျပ်ဖြင့် ပြောပါ။',
        replyEnglish: 'Nothing was saved. Please say the item and exact total amount in MMK.',
      };
    }
    const itemName = extractItemName(transcript) || (isSale ? 'Sale' : 'Purchase');
    return {
      action: isSale ? 'RECORD_SALE' : 'RECORD_PURCHASE',
      itemName,
      amount,
      replyBurmese: `${itemName}၊ ${amount.toLocaleString()} ကျပ်ကို စစ်ဆေးပြီး စာရင်းသွင်းနိုင်ပါသည်။`,
      replyEnglish: `Review ${itemName} for ${amount.toLocaleString()} MMK, then save the record.`,
    };
  }
  if (transcript.includes('ချေးငွေ') || /\b(loan|finance|bank)\b/i.test(lower)) {
    return { action: 'CHECK_LOAN', replyBurmese: 'ငွေကြေးနှင့် ချေးငွေစာမျက်နှာကို ဖွင့်ပေးပါမည်။', replyEnglish: 'Opening the finance and loan page.' };
  }
  if (transcript.includes('မိုးလေဝသ') || transcript.includes('ရာသီဥတု') || /\b(weather|forecast)\b/i.test(lower)) {
    return { action: 'CHECK_WEATHER', replyBurmese: 'လက်ရှိတည်နေရာအတွက် မိုးလေဝသစာမျက်နှာကို ဖွင့်ပေးပါမည်။', replyEnglish: 'Opening the weather page for your location.' };
  }
  if (transcript.includes('ကုန်ပစ္စည်း') || transcript.includes('စာရင်း') || /\b(inventory|stock|transactions?)\b/i.test(lower)) {
    return { action: 'INVENTORY_INQUIRY', replyBurmese: 'ကုန်ပစ္စည်းနှင့် အရောင်းအဝယ်စာရင်းကို ဖွင့်ပေးပါမည်။', replyEnglish: 'Opening inventory and transaction records.' };
  }
  return {
    action: 'GENERAL_QUERY',
    replyBurmese: 'အရောင်း၊ အဝယ်၊ ချေးငွေ၊ ကုန်ပစ္စည်းစာရင်း သို့မဟုတ် မိုးလေဝသအကြောင်း မေးနိုင်ပါသည်။',
    replyEnglish: 'You can record sales or purchases, or ask about loans, inventory, and weather.',
  };
}

function validateVoiceResult(candidate: unknown, transcript: string): VoiceResult {
  if (!candidate || typeof candidate !== 'object') return parseVoiceCommand(transcript);
  const value = candidate as Record<string, unknown>;
  const action = typeof value.action === 'string' && voiceActions.has(value.action as VoiceAction)
    ? value.action as VoiceAction
    : 'GENERAL_QUERY';
  const amount = typeof value.amount === 'number' && Number.isFinite(value.amount) && value.amount > 0
    ? Math.min(Math.round(value.amount), 1_000_000_000_000)
    : undefined;

  if ((action === 'RECORD_SALE' || action === 'RECORD_PURCHASE') && !amount) {
    return parseVoiceCommand(transcript);
  }

  return {
    action,
    itemName: typeof value.itemName === 'string' ? value.itemName.trim().slice(0, 120) : undefined,
    quantity: typeof value.quantity === 'string' || typeof value.quantity === 'number' ? value.quantity : undefined,
    amount,
    replyBurmese: typeof value.replyBurmese === 'string' && value.replyBurmese.trim()
      ? value.replyBurmese.trim().slice(0, 500)
      : 'တောင်းဆိုမှုကို လုပ်ဆောင်ပြီးပါပြီ။',
    replyEnglish: typeof value.replyEnglish === 'string' && value.replyEnglish.trim()
      ? value.replyEnglish.trim().slice(0, 500)
      : 'Your request has been processed.',
  };
}

// AI Voice Processing Route. A deterministic parser remains available when Gemini is unavailable.
app.post('/api/ai/voice-process', async (req, res) => {
  const transcript = typeof req.body?.transcript === 'string' ? req.body.transcript.trim() : '';
  if (!transcript) return res.status(400).json({ error: 'Transcript is required' });
  if (transcript.length > 500) return res.status(400).json({ error: 'Transcript is too long' });

  const fallback = parseVoiceCommand(transcript);
  const recognizedTransaction = /\b(sold|sell|sale|bought|buy|purchase)\b/i.test(transcript)
    || transcript.includes('ရောင်း') || transcript.includes('ဝယ်');
  if (fallback.action !== 'GENERAL_QUERY' || recognizedTransaction) return res.json(fallback);
  const ai = getGeminiClient();
  if (!ai) return res.json(fallback);

  try {
    const prompt = `Classify this Myanmar small-business voice command and extract only information explicitly present: ${JSON.stringify(transcript)}.
Never estimate or invent money. For sales and purchases, amount must be the exact total MMK stated by the user; otherwise use GENERAL_QUERY and ask for it. Navigation commands should use CHECK_LOAN, CHECK_WEATHER, or INVENTORY_INQUIRY. Reply naturally in both Burmese and English.`;
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: [...voiceActions] },
            itemName: { type: Type.STRING },
            quantity: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            replyBurmese: { type: Type.STRING },
            replyEnglish: { type: Type.STRING },
          },
          required: ['action', 'replyBurmese', 'replyEnglish'],
        },
      },
    });
    return res.json(validateVoiceResult(JSON.parse(response.text || '{}'), transcript));
  } catch (error) {
    console.error('Gemini voice processing failed; using the local parser.', error);
    return res.json(fallback);
  }
});

// AI Manager Business Insights Route
app.post('/api/ai/business-insights', async (req, res) => {
  try {
    const { totalSales = 150000, totalExpenses = 18000, loanBalance = 500000 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        insightBurmese: 'သင်၏ အမြတ်ငွေသည် ချေးငွေပြန်ဆပ်ရန် လုံလောက်ပါသည်',
        recommendationBurmese: 'ယခုအပတ် ပြန်ဆပ်ရန် အကြံပြုချက်: ၅၀,၀၀၀ ကျပ်',
        suggestedRepayment: 50000,
        insightEnglish: 'Your profit is sufficient for loan repayment.',
        recommendationEnglish: 'Recommended repayment for this week: 50,000 MMK',
      });
    }

    const prompt = `You are an expert AI Business Advisor for a small grocery & dry goods store owner in Yangon, Myanmar.
Context:
- Today's Sales: ${totalSales} MMK
- Today's Expenses: ${totalExpenses} MMK
- Loan Balance Remaining: ${loanBalance} MMK

Provide concise, encouraging advice in Burmese and English formatted as JSON:
{
  "insightBurmese": "short 1-sentence assessment in Burmese (e.g., သင်၏ အမြတ်ငွေသည် ချေးငွေပြန်ဆပ်ရန် လုံလောက်ပါသည်)",
  "recommendationBurmese": "recommended weekly payment in Burmese (e.g., ယခုအပတ် ပြန်ဆပ်ရန် အကြံပြုချက်: ၅၀,၀၀၀ ကျပ်)",
  "suggestedRepayment": 50000,
  "insightEnglish": "English translation of assessment",
  "recommendationEnglish": "English translation of recommendation"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err) {
    console.error('Error in /api/ai/business-insights:', err);
    return res.json({
      insightBurmese: 'သင်၏ အမြတ်ငွေသည် ချေးငွေပြန်ဆပ်ရန် လုံလောက်ပါသည်',
      recommendationBurmese: 'ယခုအပတ် ပြန်ဆပ်ရန် အကြံပြုချက်: ၅၀,၀၀၀ ကျပ်',
      suggestedRepayment: 50000,
      insightEnglish: 'Your profit is sufficient for loan repayment.',
      recommendationEnglish: 'Recommended repayment for this week: 50,000 MMK',
    });
  }
});

// Condition label translation
const weatherConditionBurmese: Record<string, string> = {
  'clear': 'နေသာပါသည်',
  'clouds': 'မိုးတိမ်ထူထပ်သည်',
  'drizzle': 'မိုးဖွဲဖွဲကျနေသည်',
  'rain': 'မိုးရွာနေသည်',
  'thunderstorm': 'မိုးကြိုးမုန်တိုင်းကျနေသည်',
  'snow': 'နှင်းကျနေသည်',
  'mist': 'မြူဆိုင်းနေသည်',
  'haze': 'မြူခိုးများနေသည်',
  'fog': 'မြူထူထပ်နေသည်',
  'dust': 'ဖုန်မှုန့်များနေသည်',
};

// Business advice templates based on weather conditions
function getBusinessAdvice(condition: string, temp: number, rainPct: number): { burmese: string; english: string } {
  if (condition.includes('thunderstorm') || rainPct > 70) {
    return {
      burmese: 'မိုးသည်းထန်နိုင်သဖြင့် ဆိုင်အမိုးနှင့် ကုန်ပစ္စည်းကာကွယ်ရေး အထူးဂရုစိုက်ပါ။ နံနက်ပိုင်းတွင် အရောင်းမြှင့်တင်ပါ။',
      english: 'Heavy rain expected. Secure store awnings and prioritize morning sales.',
    };
  }
  if (condition.includes('rain') || rainPct > 50) {
    return {
      burmese: 'မိုးရွာနိုင်သဖြင့် နံနက်ပိုင်းတွင် ဆန်နှင့်ကုန်စုံပစ္စည်း အရောင်းမြှင့်တင်ပါ။ မိုးကာအသင့်ပြင်ထားပါ။',
      english: 'Rain likely. Prioritize morning sales for grains and cover goods.',
    };
  }
  if (temp >= 35) {
    return {
      burmese: 'ရာသီဥတုပူပြင်းသဖြင့် စားအုန်းဆီ၊ အအေးနှင့်သောက်ရေသန့် ရောင်းအားမြင့်တက်နိုင်ပါသည်။',
      english: 'Hot weather will boost demand for cooking oil, beverages, and bottled water.',
    };
  }
  if (condition.includes('clear') || condition.includes('sunny')) {
    return {
      burmese: 'နေသာသောရာသီဥတုကြောင့် ဈေးရောင်းရန်အဆင်ပြေပါသည်။ ကုန်ပစ္စည်းများပြသရောင်းချရန် သင့်တော်ပါသည်။',
      english: 'Sunny weather is ideal for market trading. Good day to display and sell goods.',
    };
  }
  return {
    burmese: 'ယနေ့ရာသီဥတုသည် ပုံမှန်အတိုင်းဖြစ်ပြီး စီးပွားရေးလုပ်ငန်းဆောင်ရွက်ရန် အဆင်ပြေပါသည်။',
    english: 'Normal weather conditions. Business as usual.',
  };
}

// OpenWeatherMap icon mapping
function mapWeatherIcon(iconCode: string): string {
  const iconMap: Record<string, string> = {
    '01d': 'wb_sunny', '01n': 'clear_night',
    '02d': 'partly_cloudy_day', '02n': 'partly_cloudy_night',
    '03d': 'cloud', '03n': 'cloud',
    '04d': 'cloud', '04n': 'cloud',
    '09d': 'rainy', '09n': 'rainy',
    '10d': 'rainy', '10n': 'rainy',
    '11d': 'thunderstorm', '11n': 'thunderstorm',
    '13d': 'ac_unit', '13n': 'ac_unit',
    '50d': 'mist', '50n': 'mist',
  };
  return iconMap[iconCode] || 'wb_cloudy';
}

// Server-side proxy avoids browser CORS failures and keeps the map query bounded.
app.get('/api/finance/nearby', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: 'Valid latitude and longitude are required' });
  }
  const query = `[out:json][timeout:25];(
    nwr(around:15000,${lat},${lng})["amenity"="bank"];
    nwr(around:15000,${lat},${lng})["office"~"financial|microfinance|ngo"];
    nwr(around:15000,${lat},${lng})["name"~"microfinance|micro finance|NGO|foundation",i];
  );out center tags 100;`;
  try {
    const endpoints = [
      'https://overpass.private.coffee/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://z.overpass-api.de/api/interpreter',
      'https://overpass-api.de/api/interpreter',
    ];
    let lastError: unknown;
    for (const endpoint of endpoints) {
      try {
        const overpassResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'FirstStep-Myanmar/1.0',
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(12_000),
        });
        if (!overpassResponse.ok) throw new Error(`Overpass returned ${overpassResponse.status}`);
        const payload = await overpassResponse.json() as { elements?: unknown[] };
        return res.json({ elements: Array.isArray(payload.elements) ? payload.elements : [] });
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  } catch (error) {
    console.error('Nearby finance lookup failed:', error);
    return res.status(502).json({ error: 'Nearby organization search is temporarily unavailable' });
  }
});

const cityLocations: Record<string, { lat: number; lon: number; burmese: string }> = {
  Yangon: { lat: 16.8409, lon: 96.1735, burmese: 'ရန်ကုန်မြို့' },
  Mandalay: { lat: 21.9588, lon: 96.0891, burmese: 'မန္တလေးမြို့' },
  Naypyidaw: { lat: 19.7633, lon: 96.0785, burmese: 'နေပြည်တော်' },
  Bago: { lat: 17.3352, lon: 96.4814, burmese: 'ပဲခူးမြို့' },
  Mawlamyine: { lat: 16.4905, lon: 97.6283, burmese: 'မော်လမြိုင်မြို့' },
  Taunggyi: { lat: 20.7892, lon: 97.0378, burmese: 'တောင်ကြီးမြို့' },
  Myitkyina: { lat: 25.3833, lon: 97.4, burmese: 'မြစ်ကြီးနားမြို့' },
  Sittwe: { lat: 20.1462, lon: 92.8984, burmese: 'စစ်တွေမြို့' },
  Pathein: { lat: 16.7792, lon: 94.7321, burmese: 'ပုသိမ်မြို့' },
  'Pyin Oo Lwin': { lat: 22.035, lon: 96.4568, burmese: 'ပြင်ဦးလွင်မြို့' },
};

function weatherCodeDetails(code: number) {
  if (code === 0) return { condition: 'clear', english: 'clear sky', icon: 'wb_sunny' };
  if (code <= 3) return { condition: 'clouds', english: 'partly cloudy', icon: 'partly_cloudy_day' };
  if (code <= 48) return { condition: 'fog', english: 'foggy', icon: 'foggy' };
  if (code <= 57) return { condition: 'drizzle', english: 'drizzle', icon: 'rainy_light' };
  if (code <= 67 || (code >= 80 && code <= 82)) return { condition: 'rain', english: 'rain', icon: 'rainy' };
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { condition: 'snow', english: 'snow', icon: 'ac_unit' };
  if (code >= 95) return { condition: 'thunderstorm', english: 'thunderstorm', icon: 'thunderstorm' };
  return { condition: 'clouds', english: 'cloudy', icon: 'cloud' };
}

// Live weather from Open-Meteo. It works without exposing or maintaining a client API key.
app.get('/api/weather', async (req, res) => {
  try {
    const requestedCity = typeof req.query.city === 'string' ? req.query.city : '';
    const requestedLat = Number(req.query.lat);
    const requestedLon = Number(req.query.lon);
    const hasCoordinates = Number.isFinite(requestedLat) && Number.isFinite(requestedLon)
      && requestedLat >= -90 && requestedLat <= 90 && requestedLon >= -180 && requestedLon <= 180;
    const knownCity = cityLocations[requestedCity] || cityLocations.Yangon;
    const latitude = hasCoordinates ? requestedLat : knownCity.lat;
    const longitude = hasCoordinates ? requestedLon : knownCity.lon;
    const cityName = hasCoordinates ? 'Current location' : (cityLocations[requestedCity] ? requestedCity : 'Yangon');
    const cityBurmese = hasCoordinates ? 'လက်ရှိတည်နေရာ' : knownCity.burmese;

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m',
      timezone: 'auto',
      forecast_days: '1',
    });
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!weatherResponse.ok) throw new Error(`Open-Meteo returned ${weatherResponse.status}`);
    const weather = await weatherResponse.json() as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        precipitation_probability?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };
    if (!weather.current) throw new Error('Open-Meteo returned no current conditions');

    const temperature = Math.round(Number(weather.current.temperature_2m) || 0);
    const humidity = Math.round(Number(weather.current.relative_humidity_2m) || 0);
    const rainProbability = Math.max(0, Math.min(100, Math.round(Number(weather.current.precipitation_probability) || 0)));
    const windSpeed = Math.max(0, Math.round(Number(weather.current.wind_speed_10m) || 0));
    const details = weatherCodeDetails(Number(weather.current.weather_code) || 0);
    const conditionBurmese = weatherConditionBurmese[details.condition] || 'ပုံမှန်ရာသီဥတု';
    const advice = getBusinessAdvice(details.condition, temperature, rainProbability);
    const stormWarning = details.condition === 'thunderstorm'
      ? 'မိုးကြိုးမုန်တိုင်း ဖြစ်နိုင်ပါသည်။ ဆိုင်နှင့် ကုန်ပစ္စည်းများကို ကာကွယ်ထားပါ။'
      : undefined;

    return res.json({
      city: cityName,
      cityBurmese,
      tempCelsius: temperature,
      conditionBurmese,
      conditionEnglish: details.english,
      iconName: details.icon,
      rainProbabilityPercent: rainProbability,
      humidityPercent: humidity,
      windSpeedKmh: windSpeed,
      stormWarning,
      voiceAnnouncementBurmese: `${cityBurmese}၏ လက်ရှိအပူချိန် ${temperature} ဒီဂရီဆဲလ်စီးယပ်စ်၊ ${conditionBurmese}၊ မိုးရွာနိုင်ခြေ ${rainProbability} ရာခိုင်နှုန်းရှိပါသည်။`,
      businessAdviceBurmese: advice.burmese,
      businessAdviceEnglish: advice.english,
    });
  } catch (error) {
    console.error('Live weather lookup failed:', error);
    return res.status(502).json({ error: 'Live weather is temporarily unavailable' });
  }
});

// Vite Middleware integration for dev and static serving for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
