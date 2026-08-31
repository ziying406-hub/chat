import { useState, useCallback } from "react";
import zhCN from "./zh-CN";

type Locale = "zh-CN";

const translations: Record<Locale, Record<string, string>> = {
  "zh-CN": zhCN,
};

let currentLocale: Locale = "zh-CN";

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string): string {
  return translations[currentLocale][key] ?? key;
}

export function useTranslation() {
  const [, setTick] = useState(0);
  const translate = useCallback((key: string) => {
    return translations[currentLocale][key] ?? key;
  }, []);
  const setLang = useCallback((locale: Locale) => {
    currentLocale = locale;
    setTick((n) => n + 1);
  }, []);
  return { t: translate, setLocale: setLang, locale: currentLocale };
}

export default { t, setLocale, getLocale, useTranslation };
