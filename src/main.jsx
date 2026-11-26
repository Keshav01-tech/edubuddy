import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// A page opened before a new deploy asks for old page files that are gone. Reload once to get the new version.
const RELOAD_KEY = 'edubuddy-reloaded'
window.addEventListener('vite:preloadError', (event) => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})
// The app started, so a later stale file may trigger one more reload.
setTimeout(() => { try { sessionStorage.removeItem(RELOAD_KEY) } catch { /* ignore */ } }, 10000)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
