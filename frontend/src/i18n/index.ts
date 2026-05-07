import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import ru from "./locales/ru";
import es from "./locales/es";
import pt from "./locales/pt";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      es: { translation: es },
      pt: { translation: pt },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "es", "pt", "ru"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "ct_language",
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
