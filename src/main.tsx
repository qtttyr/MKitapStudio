import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { I18nProvider } from './lib/i18n-provider'
import { StudioProvider } from './lib/store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <StudioProvider>
        <App />
      </StudioProvider>
    </I18nProvider>
  </StrictMode>,
)
