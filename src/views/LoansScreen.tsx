import React, { useEffect, useMemo, useState } from 'react';
import type { FinancialInstitution, RegisteredLoanProfile, UserProfile } from '../types';
import { FloatingMicButton } from '../components/FloatingMicButton';
import { MapView } from '../components/MapView';

interface LoansScreenProps {
  financialInstitutions: FinancialInstitution[];
  registeredLoanProfile: RegisteredLoanProfile | null;
  userProfile: UserProfile;
  onOpenVoiceModal: () => void;
  onUpdateRegisteredLoan: (updatedProfile: RegisteredLoanProfile) => void;
  onAddCreditPoints: (pointsToAdd: number) => void;
  language: 'my' | 'en';
}

type OrganizationType = 'bank' | 'microfinance' | 'ngo';

interface NearbyOrganization {
  id: string;
  name: string;
  type: OrganizationType;
  lat: number;
  lng: number;
  distanceKm: number;
  address: string;
}

interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const FILTERS: Array<{ id: 'all' | OrganizationType; labelMy: string; labelEn: string }> = [
  { id: 'all', labelMy: 'အားလုံး', labelEn: 'All' },
  { id: 'bank', labelMy: 'ဘဏ်များ', labelEn: 'Banks' },
  { id: 'microfinance', labelMy: 'အသေးစားငွေရေးကြေးရေး', labelEn: 'Microfinance' },
  { id: 'ngo', labelMy: 'အကျိုးအမြတ်မယူသော အဖွဲ့အစည်းများ', labelEn: 'NGOs' },
];

const TYPE_META: Record<OrganizationType, { icon: string; labelMy: string; labelEn: string; color: string }> = {
  bank: { icon: 'account_balance', labelMy: 'ဘဏ်', labelEn: 'Bank', color: 'bg-[#e0f2f1] text-[#00535b]' },
  microfinance: { icon: 'payments', labelMy: 'အသေးစားငွေရေးကြေးရေး', labelEn: 'Microfinance', color: 'bg-[#fff0e9] text-[#8c4e35]' },
  ngo: { icon: 'diversity_3', labelMy: 'အကျိုးအမြတ်မယူသော အဖွဲ့အစည်း', labelEn: 'NGO', color: 'bg-[#fff4d6] text-[#825b00]' },
};

const distanceBetween = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const radius = 6371;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const classifyOrganization = (tags: Record<string, string>): OrganizationType => {
  const searchable = `${tags.name ?? ''} ${tags.operator ?? ''} ${tags.office ?? ''}`.toLowerCase();
  if (tags.amenity === 'bank') return 'bank';
  if (tags.office === 'ngo' || /\bngo\b|foundation|charity/.test(searchable)) return 'ngo';
  return 'microfinance';
};

const formatAddress = (tags: Record<string, string>) => {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  return [street, tags['addr:suburb'], tags['addr:city']].filter(Boolean).join(', ');
};

const googleMapsUrl = (place: NearbyOrganization) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.lat},${place.lng}`)}`;

export const LoansScreen: React.FC<LoansScreenProps> = ({
  registeredLoanProfile,
  userProfile,
  onOpenVoiceModal,
  language,
}) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [organizations, setOrganizations] = useState<NearbyOrganization[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | OrganizationType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const t = (my: string, en: string) => language === 'my' ? my : en;

  useEffect(() => {
    if (!location) return;
    const controller = new AbortController();
    const findNearby = async () => {
      setIsLoading(true);
      setSearchError('');
      const { lat, lng } = location;
      const cacheKey = `first-step:finance:${lat.toFixed(2)}:${lng.toFixed(2)}`;
      try {
        const search = new URLSearchParams({ lat: String(lat), lng: String(lng) });
        const response = await fetch(`/api/finance/nearby?${search.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Search service unavailable');
        const payload = await response.json() as { elements?: OverpassElement[] };
        const seen = new Set<string>();
        const results = (payload.elements ?? []).flatMap((element): NearbyOrganization[] => {
          const placeLat = element.lat ?? element.center?.lat;
          const placeLng = element.lon ?? element.center?.lon;
          if (placeLat == null || placeLng == null) return [];
          const tags = element.tags ?? {};
          const name = tags.name ?? tags.operator;
          if (!name) return [];
          const key = `${name.toLowerCase()}-${placeLat.toFixed(5)}-${placeLng.toFixed(5)}`;
          if (seen.has(key)) return [];
          seen.add(key);
          return [{
            id: `${element.type}-${element.id}`,
            name,
            type: classifyOrganization(tags),
            lat: placeLat,
            lng: placeLng,
            distanceKm: distanceBetween(lat, lng, placeLat, placeLng),
            address: formatAddress(tags),
          }];
        }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 30);
        setOrganizations(results);
        try {
          window.localStorage.setItem(cacheKey, JSON.stringify(results));
        } catch {
          // The live results remain usable even when browser storage is unavailable.
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          try {
            const cached = JSON.parse(window.localStorage.getItem(cacheKey) || '[]');
            if (Array.isArray(cached) && cached.length > 0) {
              setOrganizations(cached);
              setSearchError(t('တိုက်ရိုက်ရှာဖွေမှု မရသဖြင့် နောက်ဆုံးသိမ်းထားသော ရလဒ်များကို ပြထားပါသည်။', 'Live search is unavailable, so the last saved results are shown.'));
            } else {
              setSearchError(t('အနီးရှိအဖွဲ့အစည်းများကို ယခုရှာမရပါ။ ထပ်မံကြိုးစားပါ။', 'Nearby search is temporarily unavailable. Please try again.'));
            }
          } catch {
            setSearchError(t('အနီးရှိအဖွဲ့အစည်းများကို ယခုရှာမရပါ။ ထပ်မံကြိုးစားပါ။', 'Nearby search is temporarily unavailable. Please try again.'));
          }
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    void findNearby();
    return () => controller.abort();
  }, [location, language]);

  const filteredOrganizations = useMemo(() => activeFilter === 'all'
    ? organizations
    : organizations.filter((organization) => organization.type === activeFilter), [activeFilter, organizations]);

  const openInGoogleMaps = (organization: NearbyOrganization) => {
    window.open(googleMapsUrl(organization), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="screen-shell space-y-6 lg:space-y-8">
      <section>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#00535b]">{t('ငွေရေးကြေးရေး ဝန်ဆောင်မှုများ', 'Finance Services')}</h2>
        <p className="mt-1 text-sm font-medium text-[#3e494a]">{t('သင့်အနီးရှိ ဘဏ်၊ အသေးစားငွေရေးကြေးရေးနှင့် NGO အဖွဲ့အစည်းများကို တိုက်ရိုက်ရှာဖွေပါ။', 'Find banks, microfinance providers and NGOs near your live location.')}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-[#00383f] to-[#006d77] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-[#9becf7]">{t('ခရက်ဒစ်ရမှတ်', 'Credit points')}</p>
          <p className="mt-2 text-3xl font-black">{userProfile.creditPoints}</p>
          <p className="mt-1 text-xs text-white/75">{t('အကောင့်အသစ်သည် သုညမှ စတင်ပါသည်။', 'New accounts begin at zero.')}</p>
        </div>
        <div className="rounded-3xl border border-[#bec8ca]/30 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">{t('လက်ရှိချေးငွေ', 'Active loan')}</p>
          <p className="mt-2 text-lg font-extrabold text-[#00201e]">{registeredLoanProfile?.organizationName ?? t('မရှိသေးပါ', 'None yet')}</p>
          <p className="mt-1 text-xs text-[#3e494a]">{registeredLoanProfile ? `${registeredLoanProfile.loanAmountMMK.toLocaleString()} MMK` : t('ချေးငွေအချက်အလက် မရှိသေးပါ။', 'No loan record yet.')}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-extrabold text-[#00535b]">{t('အနီးရှိ ငွေရေးကြေးရေး အဖွဲ့အစည်းများ', 'Nearby financial organizations')}</h3>
            <p className="mt-1 text-xs text-[#3e494a]">{location ? t('တည်နေရာအလိုက် အနီးဆုံးမှ စီထားသည်။', 'Sorted nearest first from your live location.') : t('မြေပုံပေါ်ရှိ “Use my location” ကို နှိပ်ပါ။', 'Select “Use my location” on the map to begin.')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${activeFilter === filter.id ? 'bg-[#00535b] text-white' : 'border border-[#bec8ca] bg-white text-[#3e494a]'}`}>
                {t(filter.labelMy, filter.labelEn)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-80 overflow-hidden rounded-3xl border border-[#00535b]/15 bg-[#e4fffb] shadow-sm md:h-96">
          <MapView
            markers={filteredOrganizations.map((organization) => ({
              id: organization.id,
              name: organization.name,
              lat: organization.lat,
              lng: organization.lng,
              iconName: TYPE_META[organization.type].icon,
              containerBgClass: TYPE_META[organization.type].color,
            }))}
            center={location ?? { lat: 19.7633, lng: 96.0785 }}
            zoom={location ? 14 : 6}
            language={language}
            onLocationChange={(nextLocation) => setLocation({ lat: nextLocation.lat, lng: nextLocation.lng })}
            onMarkerClick={(id) => {
              const organization = organizations.find((item) => item.id === id);
              if (organization) openInGoogleMaps(organization);
            }}
          />
        </div>
        {searchError && <p role="alert" className="rounded-2xl bg-[#ffdad6] p-4 text-sm font-bold text-[#93000a]">{searchError}</p>}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-extrabold text-[#00535b]">{t('ရွေးချယ်နိုင်သော အဖွဲ့အစည်း အသေးစိတ်', 'Nearby organization details')}</h3>
          {organizations.length > 0 && <span className="rounded-full bg-[#e4fffb] px-3 py-1 text-xs font-bold text-[#00535b]">{filteredOrganizations.length} {t('ခု', 'found')}</span>}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-40 animate-pulse rounded-3xl bg-white" />)}
          </div>
        ) : filteredOrganizations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredOrganizations.map((organization) => {
              const meta = TYPE_META[organization.type];
              return (
                <button key={organization.id} onClick={() => openInGoogleMaps(organization)} className="group flex min-h-40 w-full items-start gap-4 rounded-3xl border border-[#bec8ca]/30 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#006d77]/40 hover:shadow-md">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.color}`}><span className="material-symbols-outlined text-2xl">{meta.icon}</span></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-[#8c4e35]">{t(meta.labelMy, meta.labelEn)}</span>
                    <span className="mt-1 block text-base font-extrabold text-[#00201e]">{organization.name}</span>
                    <span className="mt-2 block text-xs text-[#3e494a]">{organization.address || t('လိပ်စာအသေးစိတ်မရှိပါ', 'No detailed address')}</span>
                    <span className="mt-3 flex items-center gap-1 text-xs font-extrabold text-[#00535b]">{organization.distanceKm.toFixed(1)} km · {t('Google Maps တွင်ကြည့်မည်', 'Open in Google Maps')} <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">open_in_new</span></span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#00535b]/25 bg-white p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[#006d77]">location_searching</span>
            <p className="mt-2 font-bold text-[#3e494a]">{location ? t('ဤဧရိယာအတွင်း အဖွဲ့အစည်းမတွေ့ပါ။', 'No matching organizations were found in this area.') : t('သင့်တည်နေရာကို ဖွင့်ပြီး အနီးရှိအဖွဲ့အစည်းများကို ရှာပါ။', 'Enable your location to discover nearby organizations.')}</p>
          </div>
        )}
      </section>

      <FloatingMicButton onOpenVoiceModal={onOpenVoiceModal} />
    </div>
  );
};
