import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import ar from './ar.json';
import en from './en.json';

const resources = { ar: { translation: ar }, en: { translation: en } };

const deviceLang = Localization.getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLang,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});

// تفعيل RTL تلقائيًا عند اختيار العربية
export const applyDirection = (lang) => {
  const isRTL = lang === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    // ملاحظة: قد يتطلب هذا إعادة تشغيل التطبيق (Expo Updates.reloadAsync)
  }
};

applyDirection(deviceLang);

export default i18n;
