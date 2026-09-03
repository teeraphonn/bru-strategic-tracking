import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Auto-reload on new deployment chunk mismatch
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lock = sessionStorage.getItem('chunk_reload_lock');
  if (!lock) {
    sessionStorage.setItem('chunk_reload_lock', 'true');
    window.location.reload();
  }
});

// Clear reload lock after successful boot
setTimeout(() => {
  sessionStorage.removeItem('chunk_reload_lock');
}, 5000);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
