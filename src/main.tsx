import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// TEMP: Log redirect URI env to verify .env is loaded
console.log('DEBUG REDIRECT', import.meta.env.VITE_GOOGLE_REDIRECT_URI);

// If browser lands on Supabase OAuth redirect path, clean it up so our SPA renders normally.
if (window.location.pathname.startsWith('/auth/callback')) {
  // Preserve any hash fragment if needed (Supabase passes session in hash, but getSession handles it)
  const hash = window.location.hash;
  // Replace state instead of push to avoid back-button confusion
  window.history.replaceState(null, '', '/' + (hash || ''));
}

console.log('VITE_GOOGLE_REDIRECT_URI =', import.meta.env.VITE_GOOGLE_REDIRECT_URI);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
