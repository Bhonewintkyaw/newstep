import bowingFarmerImg from '../assets/images/bowing_farmer_1784709620860.jpg';
import type { UserProfile, WeatherData } from '../types';

export const emptyUserProfile: UserProfile = {
  name: '',
  titleBurmese: '',
  titleEnglish: '',
  ratingStars: 0,
  creditPoints: 0,
  starLevelTitleBurmese: 'အကောင့်အသစ်',
  starLevelTitleEnglish: 'New account',
  trustedStatusBurmese: 'စတင်အသုံးပြုသူ',
  trustedStatusEnglish: 'Getting started',
  nrcNumber: '',
  phone: '',
  avatarUrl: bowingFarmerImg,
  shopName: '',
  city: '',
};

export const emptyWeatherData: WeatherData = {
  city: '',
  cityBurmese: '',
  tempCelsius: 0,
  conditionBurmese: 'တည်နေရာ မသတ်မှတ်ရသေးပါ',
  conditionEnglish: 'Location not set',
  iconName: 'location_off',
  rainProbabilityPercent: 0,
  humidityPercent: 0,
  windSpeedKmh: 0,
  voiceAnnouncementBurmese: 'တည်နေရာသတ်မှတ်ပြီးနောက် မိုးလေဝသအချက်အလက်ကို ပြသပါမည်။',
  businessAdviceBurmese: 'ဒေတာမရှိသေးပါ။',
  businessAdviceEnglish: 'No data yet.',
};
