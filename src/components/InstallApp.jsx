import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useInstallApp } from '../services/pwa';
import { useT } from '../i18n';

const HIDE_KEY = 'edubuddy-install-hidden';
const readHidden = () => { try { return localStorage.getItem(HIDE_KEY) === '1'; } catch { return false; } };

/** A sidebar entry that installs the app; shown only when the phone or computer can install it. */
export function InstallNavItem({ className }) {
  const { t } = useT();
  const { canInstall, install } = useInstallApp();
  if (!canInstall) return null;
  return (
    <button type="button" onClick={install} className={`${className} w-full`}>
      <Download className="w-[18px] h-[18px] shrink-0 text-[#005a9c]" />
      {t('Install app')}
    </button>
  );
}

/** A card that offers to install the app (or explains how on iPhone). It can be closed for good. */
export function InstallBanner({ appName }) {
  const { t } = useT();
  const { canInstall, iosHint, install } = useInstallApp();
  const [hidden, setHidden] = useState(readHidden);
  if (hidden || (!canInstall && !iosHint)) return null;
  const hide = () => {
    setHidden(true);
    try { localStorage.setItem(HIDE_KEY, '1'); } catch { /* ignore */ }
  };
  return (
    <section className="flex items-start gap-3 rounded-3xl bg-white p-4 shadow-card ring-1 ring-[#cfe3f3]">
      <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900">{t('Install')} {appName}</p>
        {canInstall ? (
          <>
            <p className="mt-0.5 text-xs text-neutral-500">{t('Open it from your home screen like any app.')}</p>
            <button type="button" onClick={install} className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#005a9c] px-3.5 text-sm font-semibold text-white hover:bg-[#1b365d]">
              <Download className="w-4 h-4" /> {t('Install app')}
            </button>
          </>
        ) : (
          <p className="mt-0.5 text-xs text-neutral-600">
            {t('Tap')} <Share className="inline w-3.5 h-3.5 align-[-2px]" aria-label="Share" /> {t('then “Add to Home Screen”.')}
          </p>
        )}
      </div>
      <button type="button" onClick={hide} className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-neutral-400 hover:bg-neutral-100" aria-label={t('Close')}>
        <X className="w-4 h-4" />
      </button>
    </section>
  );
}
