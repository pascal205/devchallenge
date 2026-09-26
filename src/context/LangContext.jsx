import { createContext, useContext, useEffect, useState } from "react";
import { DICT } from "../lib/i18n.js";

const LangContext = createContext(null);
const KEY = "devchallenge-lang";

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(KEY) || "fr");

  useEffect(() => {
    localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => DICT[lang]?.[key] || DICT.fr[key] || key;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
