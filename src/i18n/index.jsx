import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { callDb } from '../services/cloud';
import hi from './hi';

/*
 * The app's language. Every screen calls t('English text') and gets it in the user's language.
 * The English text is the key, so anything not translated yet still reads correctly in English.
 * To add a language: add a dictionary file like hi.js and list it in LANGUAGES and DICTIONARIES.
 */
export const LANGUAGES = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'hi', label: 'हिंदी', short: 'हिं' },
];
const DICTIONARIES = { hi };

// Before signing in there is no account to save to; the choice waits here and is saved at sign-in.
const PENDING_KEY = 'edu_ui_language';
const readPending = () => { try { return localStorage.getItem(PENDING_KEY) || ''; } catch { return ''; } };
const writePending = (value) => { try { if (value) localStorage.setItem(PENDING_KEY, value); else localStorage.removeItem(PENDING_KEY); } catch { /* private mode */ } };

const I18nContext = createContext({ lang: 'en', setLang: () => {}, t: (text) => text });

/** Fills {name} placeholders: t('Hello {name}', { name: 'Rahul' }). */
const fill = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text);

export function I18nProvider({ children }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState(() => readPending() || 'en');
  const pendingRef = useRef(readPending());

  // On sign-in: a language chosen on the sign-in page wins and is saved; otherwise the account's saved one applies.
  useEffect(() => {
    if (!user) return;
    if (pendingRef.current) {
      const chosen = pendingRef.current;
      pendingRef.current = '';
      writePending('');
      setLangState(chosen);
      if (chosen !== user.language) callDb('prefs.save', { language: chosen }).catch(() => {});
      return;
    }
    setLangState(user.language === 'hi' ? 'hi' : 'en');
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((next) => {
    if (!LANGUAGES.some((l) => l.id === next)) return;
    setLangState(next);
    if (user) callDb('prefs.save', { language: next }).catch(() => {});
    else { pendingRef.current = next; writePending(next); }
  }, [user]);

  const t = useCallback((text, vars) => {
    const dict = DICTIONARIES[lang];
    return fill((dict && dict[text]) || text, vars);
  }, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext);

/** EN | हिं switch. Saved on the user's account, so it stays the same at the next sign-in. */
export function LanguageSwitch({ className = '' }) {
  const { lang, setLang } = useT();
  return (
    <div className={`inline-flex p-0.5 rounded-full bg-neutral-100 ring-1 ring-neutral-200 ${className}`} role="radiogroup" aria-label="Language / भाषा">
      {LANGUAGES.map((l) => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={lang === l.id}
          onClick={() => setLang(l.id)}
          lang={l.id}
          title={l.label}
          className={`h-8 min-w-10 px-2.5 rounded-full text-xs font-semibold transition-colors ${lang === l.id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
