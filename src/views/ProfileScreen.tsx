import React, { useState, useRef } from 'react';
import { UserProfile, RegisteredLoanProfile } from '../types';
import defaultFarmerImg from '../assets/images/bowing_farmer_1784709620860.jpg';

interface ProfileScreenProps {
  userProfile: UserProfile;
  currentLoan?: Record<string, unknown> | RegisteredLoanProfile;
  language: 'my' | 'en';
  onToggleLanguage: () => void;
  onResetData: () => void;
  onGoToLogin?: () => void;
  onUpdateUserProfile?: (updated: UserProfile) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  currentLoan,
  language,
  onToggleLanguage,
  onResetData,
  onGoToLogin,
  onUpdateUserProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editShopName, setEditShopName] = useState(userProfile.shopName);
  const [editPhone, setEditPhone] = useState(userProfile.phone);
  const [editCity, setEditCity] = useState(userProfile.city);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState(userProfile.avatarUrl || defaultFarmerImg);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEditModal = () => {
    setEditName(userProfile.name);
    setEditShopName(userProfile.shopName);
    setEditPhone(userProfile.phone);
    setEditCity(userProfile.city);
    setPreviewAvatarUrl(userProfile.avatarUrl || defaultFarmerImg);
    setIsEditing(true);
  };

  const handleDirectPhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewAvatarUrl(result);
        if (onUpdateUserProfile) {
          onUpdateUserProfile({
            ...userProfile,
            avatarUrl: result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUserProfile) {
      onUpdateUserProfile({
        ...userProfile,
        name: editName.trim() || userProfile.name,
        shopName: editShopName.trim() || userProfile.shopName,
        phone: editPhone.trim() || userProfile.phone,
        city: editCity.trim() || userProfile.city,
        avatarUrl: previewAvatarUrl,
      });
    }
    setIsEditing(false);
  };

  const handleResetPhotoToDefault = () => {
    setPreviewAvatarUrl(defaultFarmerImg);
    if (onUpdateUserProfile) {
      onUpdateUserProfile({
        ...userProfile,
        avatarUrl: defaultFarmerImg,
      });
    }
  };

  return (
    <div className="screen-shell max-w-5xl space-y-6 lg:space-y-8">
      {/* Hidden File Input for Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Grid Layout for Profile Header & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Profile Header Card */}
        <section className="bg-white rounded-3xl p-6 shadow-md border border-[#bec8ca]/30 flex flex-col items-center text-center relative overflow-hidden">
          {/* Avatar with Camera Overlay */}
          <div className="relative mb-3 group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#006d77] shadow-md bg-[#e4fffb]">
              <img
                src={userProfile.avatarUrl || defaultFarmerImg}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Quick Upload Button Badge */}
            <button
              onClick={handleDirectPhotoClick}
              title={language === 'my' ? 'ဓာတ်ပုံ အသစ် တင်မည်' : 'Upload photo'}
              className="absolute bottom-0 right-0 w-9 h-9 bg-[#00535b] hover:bg-[#006d77] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-extrabold text-[#00201e]">{userProfile.name}</h2>
            <button
              onClick={handleOpenEditModal}
              title={language === 'my' ? 'ပြင်ဆင်မည်' : 'Edit Profile'}
              className="p-1 rounded-full text-[#00535b] hover:bg-[#e4fffb] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#3e494a]">
            {language === 'my' ? userProfile.starLevelTitleBurmese : userProfile.starLevelTitleEnglish}
          </p>

          {/* Edit Profile Action Button */}
          <button
            onClick={handleOpenEditModal}
            className="mt-3 px-4 py-1.5 bg-[#e4fffb] hover:bg-[#b7fbf3] text-[#00535b] rounded-full text-xs font-extrabold border border-[#00535b]/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            <span>{language === 'my' ? 'အချက်အလက် ပြင်ဆင်မည်' : 'Edit Profile & Photo'}</span>
          </button>

          <div className="w-full pt-4 mt-4 border-t border-gray-100 flex justify-around text-xs sm:text-sm font-bold text-[#3e494a]">
            <div>
              <p className="text-gray-400 font-normal">
                {language === 'my' ? 'ဖုန်း' : 'Phone'}
              </p>
              <p className="text-[#00201e]">{userProfile.phone}</p>
            </div>
            <div className="border-r border-gray-200" />
            <div>
              <p className="text-gray-400 font-normal">
                {language === 'my' ? 'မြို့နယ်' : 'City'}
              </p>
              <p className="text-[#00201e]">{userProfile.city}</p>
            </div>
          </div>
        </section>

        {/* Business Details & Preferences Column */}
        <div className="space-y-6">
          {/* Business Details Card */}
          <section className="bg-white rounded-3xl p-6 shadow-xs border border-[#bec8ca]/30 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-[#00535b]">
                {language === 'my' ? 'လုပ်ငန်း အချက်အလက်' : 'Shop Information'}
              </h3>
              <button
                onClick={handleOpenEditModal}
                className="text-xs font-bold text-[#00535b] hover:underline cursor-pointer"
              >
                {language === 'my' ? 'ပြင်ရန်' : 'Edit'}
              </button>
            </div>
            <div className="p-4 bg-[#e4fffb] rounded-2xl border border-[#00535b]/10 space-y-1">
              <p className="font-extrabold text-base text-[#00201e]">{userProfile.shopName}</p>
              <p className="text-xs sm:text-sm font-medium text-[#3e494a]">
                {language === 'my'
                  ? 'ဉပမာ - ကုန်စုံဆိုင်'
                  : 'Example - Grocery Store'}
              </p>
            </div>
          </section>

          {/* Preferences & Settings */}
          <section className="bg-white rounded-3xl p-6 shadow-xs border border-[#bec8ca]/30 space-y-4">
            <h3 className="font-extrabold text-base text-[#00535b]">
              {language === 'my' ? 'စနစ် ဆက်တင်များ' : 'App Preferences'}
            </h3>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00535b]">translate</span>
                <span className="text-xs sm:text-sm font-bold text-[#00201e]">
                  {language === 'my' ? 'ဘာသာစကား' : 'Language'}
                </span>
              </div>
              <button
                onClick={onToggleLanguage}
                className="px-3.5 py-1.5 bg-[#00535b] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#006d77]"
              >
                {language === 'my' ? '🇲🇲 မြန်မာ' : '🇬🇧 English'}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00535b]">graphic_eq</span>
                <span className="text-xs sm:text-sm font-bold text-[#00201e]">
                  {language === 'my' ? 'အသံ မှတ်ပုံတင်' : 'Voice Print Setup'}
                </span>
              </div>
              <span className="text-xs font-bold text-[#00535b] bg-[#b7fbf3] px-3 py-1 rounded-full">
                {language === 'my' ? 'အသုံးပြုနေသည်' : 'Active'}
              </span>
            </div>

            <div className="pt-2 space-y-2">
              {onGoToLogin && (
                <button
                  onClick={onGoToLogin}
                  className="w-full py-3 bg-[#00535b] text-white hover:bg-[#006d77] font-bold text-xs sm:text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>
                    {language === 'my'
                      ? 'အကောင့်ထွက်မည် / လော့ဂ်အင်ဝင်မည်'
                      : 'Log Out / Go to Login Screen'}
                  </span>
                </button>
              )}
              <button
                onClick={onResetData}
                className="w-full py-3 border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ffdad6]/30 font-bold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer"
              >
                {language === 'my' ? 'အကောင့်ဒေတာ ရှင်းမည်' : 'Clear Account Data'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#bec8ca]/30 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-lg text-[#00535b]">
                {language === 'my' ? 'ပရိုဖိုင် ပြင်ဆင်မည်' : 'Edit User Profile'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Photo Preview & Change Controls */}
              <div className="flex flex-col items-center gap-3 py-2 bg-[#f8f9fa] rounded-2xl p-4 border border-gray-200">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#00535b] shadow-sm relative">
                  <img
                    src={previewAvatarUrl}
                    alt="Preview avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDirectPhotoClick}
                    className="px-3 py-1.5 bg-[#00535b] text-white rounded-xl text-xs font-bold hover:bg-[#006d77] flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    <span>{language === 'my' ? 'ဓာတ်ပုံ တင်မည်' : 'Upload Picture'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPhotoToDefault}
                    className="px-3 py-1.5 border border-[#00535b]/30 text-[#00535b] rounded-xl text-xs font-bold hover:bg-[#e4fffb] flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">face</span>
                    <span>{language === 'my' ? 'မူလ တောင်သူပုံ' : 'Default Cartoon'}</span>
                  </button>
                </div>
              </div>

              {/* User Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3e494a] block">
                  {language === 'my' ? 'အမည် / နာမည်' : 'User Name'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full h-11 px-3 bg-white border border-[#bec8ca] focus:border-[#00535b] rounded-xl font-bold text-sm outline-none"
                  placeholder={language === 'my' ? 'သင့်အမည်' : 'Your name'}
                />
              </div>

              {/* Shop Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3e494a] block">
                  {language === 'my' ? 'ဆိုင် / လုပ်ငန်း အမည်' : 'Shop Name'}
                </label>
                <input
                  type="text"
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  required
                  className="w-full h-11 px-3 bg-white border border-[#bec8ca] focus:border-[#00535b] rounded-xl font-bold text-sm outline-none"
                  placeholder="e.g. စန္ဒာ ကုန်စုံဆိုင်"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3e494a] block">
                  {language === 'my' ? 'ဖုန်းနံပါတ်' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#bec8ca] focus:border-[#00535b] rounded-xl font-bold text-sm outline-none"
                  placeholder="09 450123456"
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3e494a] block">
                  {language === 'my' ? 'မြို့နယ် / ဒေသ' : 'City/Township'}
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#bec8ca] focus:border-[#00535b] rounded-xl font-bold text-sm outline-none"
                  placeholder={language === 'my' ? 'မြို့ / မြို့နယ်' : 'City or township'}
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 border border-gray-300 font-bold text-xs sm:text-sm rounded-xl text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  {language === 'my' ? 'မလုပ်တော့ပါ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00535b] hover:bg-[#006d77] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer"
                >
                  {language === 'my' ? 'သိမ်းဆည်းမည်' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
