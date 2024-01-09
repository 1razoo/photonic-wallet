import { useEffect } from "react";
import { detect, fromNavigator } from "@lingui/detect-locale";
import { loadCatalog } from "@app/i18n";
import { i18n } from "@app/config.json";
import db from "@app/db";
import { language } from "@app/signals";

const { languages, defaultLanguage } = i18n;

export default function useLanguageDetect() {
  useEffect(() => {
    const loadLanguage = async () => {
      const saved = (await db.kvp.get("language")) as string;
      const userLang =
        saved ||
        (detect(fromNavigator(), defaultLanguage) as string).substring(0, 2);
      const lang = Object.keys(languages).includes(userLang)
        ? userLang
        : defaultLanguage;
      await loadCatalog(lang);
      language.value = lang;
    };
    loadLanguage();
  }, []);
}
