import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations()
      .then(async (registrations) => {
        const currentOriginRegistrations = registrations.filter((registration) =>
          registration.scope.startsWith(window.location.origin)
        );

        if (currentOriginRegistrations.length === 0) {
          return;
        }

        await Promise.all(currentOriginRegistrations.map((registration) => registration.unregister()));

        // Dev service workers can keep stale bundles with old env values.
        if (navigator.serviceWorker.controller && !sessionStorage.getItem('manancial-sw-cleaned')) {
          sessionStorage.setItem('manancial-sw-cleaned', 'true');
          window.location.reload();
        }
      })
      .catch(() => undefined);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#fff', color: '#00153d', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' } }} />
      <App />
    </BrowserRouter>
  </StrictMode>,
);
