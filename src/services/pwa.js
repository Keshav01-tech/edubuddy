import { useEffect, useState } from 'react';

// Each kind of user installs their own app: EduBuddy Admin, Teacher or Parent. Before sign-in it is plain EduBuddy.
const APPS = {
  admin: { manifest: '/manifest-admin.webmanifest', title: 'EduBuddy Admin' },
  teacher: { manifest: '/manifest-teacher.webmanifest', title: 'EduBuddy Teacher' },
  parent: { manifest: '/manifest-parent.webmanifest', title: 'EduBuddy Parent' },
};
const DEFAULT_APP = { manifest: '/manifest.webmanifest', title: 'EduBuddy' };

/** Points the page at the signed-in user's app, so "Install" adds the right one to the phone. */
export function useRoleManifest(role) {
  useEffect(() => {
    const app = APPS[role] || DEFAULT_APP;
    const link = document.querySelector('link[rel="manifest"]');
    if (link && link.getAttribute('href') !== app.manifest) link.setAttribute('href', app.manifest);
    const title = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (title) title.setAttribute('content', app.title);
  }, [role]);
}

/** Registers the service worker once the page has loaded (published site only). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* the app still works without it */ });
  });
}

// The browser's install offer arrives once, often before any screen that wants it is open, so it is kept here.
let installEvent = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installEvent = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    notify();
  });
}

const isStandalone = () => typeof window !== 'undefined'
  && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
const isIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

/**
 * Whether this phone can install the app, and how.
 * `canInstall`: Android/desktop Chrome offered it, so `install()` opens the browser's dialog.
 * `iosHint`: on iPhone the user adds it from the Share menu instead.
 */
export function useInstallApp() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  const installed = isStandalone();
  return {
    canInstall: !installed && !!installEvent,
    iosHint: !installed && !installEvent && isIos(),
    install: async () => {
      if (!installEvent) return false;
      installEvent.prompt();
      const { outcome } = await installEvent.userChoice.catch(() => ({ outcome: 'dismissed' }));
      installEvent = null;
      notify();
      return outcome === 'accepted';
    },
  };
}
