import { useEffect, useState, type ReactNode } from 'react'
import { LangContext, loadLang, dict, type Lang, type MessageKey } from './i18n'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang)

  const setLang = (l: Lang) => {
    localStorage.setItem('mkstudio.lang', l)
    setLangState(l)
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = (k: MessageKey) => dict[lang][k] ?? dict.en[k] ?? String(k)

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}
