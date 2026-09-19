'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

export const COOKIE_CONSENT_KEY = 'kpss_cookie_consent';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): string | null {
  if (typeof window === 'undefined') return 'server';
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY);
  } catch {
    return 'dismissed';
  }
}

function getServerSnapshot(): string | null {
  return 'server';
}

export default function CookieBanner() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'essential_only');
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
  };

  // If server render or consent is already chosen, do not show
  if (consent === 'server' || consent !== null) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Çerez ve Gizlilik Tercihleri"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-red-700 shadow-xl p-4 sm:p-5"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Notice Info */}
        <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
          <Cookie className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-slate-900 block mb-0.5">
              Çerez ve Gizlilik Bildirimi (KVKK 6698)
            </span>
            <p className="text-slate-600">
              Bu sitede, arama tercihlerinizi hatırlamak ve sistem performansını analiz etmek amacıyla zorunlu ve anonim teknik çerezler kullanılmaktadır. Detaylı bilgi için{' '}
              <Link
                href="/gizlilik-politikasi"
                className="text-red-700 font-semibold underline hover:text-red-800"
              >
                Gizlilik ve Çerez Politikamızı
              </Link>{' '}
              inceleyebilirsiniz.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
          >
            Yalnızca Zorunlu Çerezler
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 transition-colors shadow-2xs cursor-pointer"
          >
            Tümünü Kabul Et
          </button>
        </div>
      </div>
    </aside>
  );
}
