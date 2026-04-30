import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { th } from "./th";
import { en } from "./en";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { th: { translation: th }, en: { translation: en } },
    fallbackLng: "th",
    supportedLngs: ["th", "en"],
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

export default i18n;
