'use client';

import { COOKIE_CONSENT_KEY } from '@/components/CookieBanner';

export type AnalyticsEventName =
  | 'search_department'
  | 'lookup_qualification_code'
  | 'filter_changed'
  | 'view_toggled'
  | 'cadre_inspected'
  | 'direct_search'
  | 'direct_search_chip';

export interface AnalyticsEventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Checks whether user has opted out of analytics via Do-Not-Track or cookie preferences
 */
export function isAnalyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;

  // Check Do Not Track browser header
  if (navigator.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1') {
    return false;
  }

  // Check cookie consent choice
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === 'essential_only') {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Track an anonymous, privacy-safe user interaction event
 */
export function trackEvent(eventName: AnalyticsEventName, params?: AnalyticsEventParams): void {
  if (!isAnalyticsAllowed()) {
    return;
  }

  // Safe client event dispatching
  if (typeof window !== 'undefined') {
    // If Google Analytics gtag is present
    const win = window as unknown as { gtag?: (type: string, name: string, data?: AnalyticsEventParams) => void };
    if (typeof win.gtag === 'function') {
      win.gtag('event', eventName, params);
    }

    // Custom non-blocking event dispatch for extensible analytics pipelines
    try {
      window.dispatchEvent(
        new CustomEvent('kpss_analytics_event', {
          detail: { eventName, params, timestamp: Date.now() },
        })
      );
    } catch {
      // ignore
    }
  }
}
