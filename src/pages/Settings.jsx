import { useTheme } from "../context/ThemeContext.jsx";
import { useLang } from "../context/LangContext.jsx";
import { LANGS } from "../lib/i18n.js";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLang();

  return (
    <div className="card">
      <h2>{t("settings_title")}</h2>

      <label>{t("settings_theme")}</label>
      <div className="theme-options">
        {[["system", t("theme_system")], ["light", t("theme_light")], ["dark", t("theme_dark")]].map(([v, l]) => (
          <button key={v} className="opt-btn" aria-pressed={theme === v} onClick={() => setTheme(v)}>{l}</button>
        ))}
      </div>

      <label style={{ marginTop: 22 }}>{t("settings_lang")}</label>
      <div className="lang-options">
        {Object.entries(LANGS).map(([code, label]) => (
          <button key={code} className="opt-btn" aria-pressed={lang === code} onClick={() => setLang(code)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
