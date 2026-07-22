import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

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

// AI Voice Processing Route
app.post('/api/ai/voice-process', async (req, res) => {
  try {
    const { transcript, currentLanguage = 'my' } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback offline parser if API key is not supplied
      const lower = transcript.toLowerCase();
      let action = 'GENERAL_QUERY';
      let replyBurmese = 'သင့်တောင်းဆိုမှုကို မန်နေဂျာ AI မှ လက်ခံရရှိပါသည်။';
      let replyEnglish = 'Manager AI received your request.';
      let amount = 0;
      let itemName = '';

      if (transcript.includes('ရောင်း') || lower.includes('sold') || lower.includes('sale')) {
        action = 'RECORD_SALE';
        replyBurmese = 'အရောင်းစာရင်း မှတ်တမ်းတင်ပြီးပါပြီ။ (ဝယ်ယူသူ စာရင်းသွင်းပြီး)';
        replyEnglish = 'Sale record logged successfully.';
        amount = 150000;
        itemName = 'ဆန် ၅ အိတ် (5 bags of rice)';
      } else if (transcript.includes('ဝယ်') || lower.includes('buy') || lower.includes('purchase')) {
        action = 'RECORD_PURCHASE';
        replyBurmese = 'အဝယ်စာရင်း မှတ်တမ်းတင်ပြီးပါပြီ။';
        replyEnglish = 'Purchase record logged successfully.';
        amount = 18000;
        itemName = 'စားအုန်းဆီ (Cooking Oil)';
      } else if (transcript.includes('ချေးငွေ') || lower.includes('loan')) {
        action = 'CHECK_LOAN';
        replyBurmese = 'သင့် လက်ရှိ ချေးငွေ ၆၅% ပြန်ဆပ်ရန် ကျန်ရှိပြီး၊ ယခုအပတ် ၅၀,၀၀၀ ကျပ် ပြန်ဆပ်ရန် အကြံပြုပါသည်။';
        replyEnglish = 'Your loan is 65% remaining, recommended weekly repayment is 50,000 MMK.';
      } else if (transcript.includes('မိုးလေဝသ') || lower.includes('weather')) {
        action = 'CHECK_WEATHER';
        replyBurmese = 'ရန်ကုန်မြို့တွင် ယနေ့ ရာသီဥတု နေသာပါသည် (၃၂°C)။ ဈေးရောင်းရန် အဆင်ပြေပါသည်။';
        replyEnglish = 'Sunny in Yangon (32°C). Good weather for market trading.';
      }

      return res.json({
        action,
        itemName,
        amount,
        replyBurmese,
        replyEnglish,
      });
    }

    const prompt = `You are the AI Business Assistant for "First Step" (ခြေလှမ်းသစ်), an app for small shop owners and micro-entrepreneurs in Myanmar.
The user spoke or typed this input: "${transcript}".

Analyze the input and output valid JSON with this exact schema:
{
  "action": "RECORD_SALE" | "RECORD_PURCHASE" | "CHECK_LOAN" | "CHECK_WEATHER" | "INVENTORY_INQUIRY" | "GENERAL_QUERY",
  "itemName": "string (name of item if mentioned, in Burmese and English)",
  "quantity": "number or string (e.g., 5 bags, 2 bottles)",
  "amount": number (estimated amount in MMK Myanmar Kyats if applicable, e.g. 150000 for 5 rice bags),
  "replyBurmese": "string (warm, friendly response in natural polite Burmese language)",
  "replyEnglish": "string (English translation of reply)"
}

Ensure the response is valid JSON only without markdown formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch {
      parsedData = {
        action: 'GENERAL_QUERY',
        replyBurmese: 'နားလည်ပါသည်၊ သင့်စကားသံအတွက် ကျေးဇူးတင်ပါသည်။',
        replyEnglish: 'Understood, thank you for your input.',
      };
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/ai/voice-process:', error);
    return res.status(500).json({
      error: 'Failed to process voice request',
      replyBurmese: 'ခေတ္တစောင့်ဆိုင်းပါ၊ အသံစနစ် လုပ်ဆောင်ရာတွင် အမှားအယွင်းရှိခဲ့ပါသည်။',
      replyEnglish: 'Error processing voice command. Please try again.',
    });
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

// Weather API
app.get('/api/weather', async (req, res) => {
  try {
    const city = req.query.city as string;
    const lat = req.query.lat as string;
    const lon = req.query.lon as string;

    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
      // Fallback to mock data if no API key
      const fallback: Record<string, any> = {
        'Yangon': { temp: 32, humidity: 78, wind: 14, condition: 'rain', rainPct: 65, icon: '10d', desc: 'light rain' },
        'Mandalay': { temp: 36, humidity: 45, wind: 10, condition: 'clear', rainPct: 10, icon: '01d', desc: 'clear sky' },
        'Naypyidaw': { temp: 30, humidity: 60, wind: 8, condition: 'clouds', rainPct: 30, icon: '04d', desc: 'overcast clouds' },
      };

      let cityKey = 'Yangon';
      if (city && fallback[city]) cityKey = city;
      else if (city) cityKey = 'Yangon';

      const data = fallback[cityKey];
      const condMain = data.condition;
      const condBurmese = weatherConditionBurmese[condMain] || 'ပုံမှန်ရာသီဥတု';
      const advice = getBusinessAdvice(condMain, data.temp, data.rainPct);

      return res.json({
        city: cityKey,
        cityBurmese: cityKey === 'Yangon' ? 'ရန်ကုန်မြို့' : cityKey === 'Mandalay' ? 'မန္တလေးမြို့' : 'နေပြည်တော်',
        tempCelsius: data.temp,
        conditionBurmese: `${condBurmese} (${data.desc})`,
        conditionEnglish: data.desc,
        iconName: mapWeatherIcon(data.icon),
        rainProbabilityPercent: data.rainPct,
        humidityPercent: data.humidity,
        windSpeedKmh: data.wind,
        stormWarning: condMain === 'thunderstorm' ? 'မိုးကြိုးမုန်တိုင်းကျရောက်နိုင်ပါသည်။ သတိထားပါ။' : undefined,
        voiceAnnouncementBurmese: `${cityKey}မြို့၏ ယနေ့ရာသီဥတုမှာ အပူချိန် ${data.temp}ဒီဂရီဆဲလ်စီးယပ်စ်ရှိပြီး ${data.desc}၊ မိုးရွာနိုင်ခြေ ${data.rainPct}ရာခိုင်နှုန်းရှိပါသည်။`,
        businessAdviceBurmese: advice.burmese,
        businessAdviceEnglish: advice.english,
      });
    }

    // Build OpenWeatherMap URL
    let url = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}&units=metric`;
    if (city) url += `&q=${encodeURIComponent(city)}`;
    else if (lat && lon) url += `&lat=${lat}&lon=${lon}`;
    else url += '&q=Yangon';

    const owmRes = await fetch(url);
    if (!owmRes.ok) {
      return res.status(owmRes.status).json({ error: 'Weather API error' });
    }

    const owm = await owmRes.json();
    const condMain = (owm.weather[0]?.main || 'Clouds').toLowerCase();
    const desc = owm.weather[0]?.description || 'overcast clouds';
    const condBurmese = weatherConditionBurmese[condMain] || 'ပုံမှန်ရာသီဥတု';
    const rainPct = owm.clouds?.all || (owm.rain ? Math.min(owm.rain['1h'] || 50, 100) : 0);
    const advice = getBusinessAdvice(condMain, owm.main.temp, rainPct);
    const cityName = owm.name || city || 'Yangon';

    // Storm warning check
    let stormWarning: string | undefined;
    if (condMain === 'thunderstorm' || (owm.main.temp >= 38 && rainPct > 60)) {
      stormWarning = 'မိုးကြိုးမုန်တိုင်းကျရောက်နိုင်ပါသည်။ ဆိုင်ကုန်ပစ္စည်းများကိုကာကွယ်ထားပါ။';
    }

    // City name in Burmese (simplified mapping)
    const cityBurmeseMap: Record<string, string> = {
      'Yangon': 'ရန်ကုန်မြို့', 'Mandalay': 'မန္တလေးမြို့', 'Naypyidaw': 'နေပြည်တော်',
      'Bago': 'ပဲခူးမြို့', 'Mawlamyine': 'မော်လမြိုင်မြို့', 'Taunggyi': 'တောင်ကြီးမြို့',
      'Myitkyina': 'မြစ်ကြီးနားမြို့', 'Sittwe': 'စစ်တွေမြို့', 'Pathein': 'ပုသိမ်မြို့',
      'Pyin Oo Lwin': 'ပြင်ဦးလွင်မြို့',
    };

    return res.json({
      city: cityName,
      cityBurmese: cityBurmeseMap[cityName] || `${cityName}မြို့`,
      tempCelsius: Math.round(owm.main.temp),
      conditionBurmese: `${condBurmese} (${desc})`,
      conditionEnglish: desc,
      iconName: mapWeatherIcon(owm.weather[0]?.icon || '01d'),
      rainProbabilityPercent: rainPct,
      humidityPercent: owm.main.humidity,
      windSpeedKmh: Math.round(owm.wind.speed * 3.6),
      stormWarning,
      voiceAnnouncementBurmese: `${cityBurmeseMap[cityName] || `${cityName}မြို့`}၏ ယနေ့ရာသီဥတုမှာ အပူချိန် ${Math.round(owm.main.temp)}ဒီဂရီဆဲလ်စီးယပ်စ်ရှိပြီး ${desc}၊ မိုးရွာနိုင်ခြေ ${rainPct}ရာခိုင်နှုန်းရှိပါသည်။`,
      businessAdviceBurmese: advice.burmese,
      businessAdviceEnglish: advice.english,
    });
  } catch (error) {
    console.error('Error in /api/weather:', error);
    return res.status(500).json({ error: 'Failed to fetch weather data' });
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
