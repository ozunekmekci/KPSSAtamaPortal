import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GizlilikPolitikasiPage, { metadata as gizlilikMeta } from '@/app/gizlilik-politikasi/page';
import KullanimKosullariPage, { metadata as kullanimMeta } from '@/app/kullanim-kosullari/page';
import NotFound from '@/app/not-found';
import CookieBanner, { COOKIE_CONSENT_KEY } from '@/components/CookieBanner';
import { trackEvent } from '@/lib/analytics';
import sitemap from '@/app/sitemap';
import nextConfig from '../next.config';

describe('Legal & Security Compliance Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Gizlilik Politikası Page', () => {
    it('renders with KVKK 6698 references and clear title', () => {
      render(<GizlilikPolitikasiPage />);
      expect(screen.getByText(/Gizlilik Politikası ve Kişisel Verilerin Korunması/i)).toBeDefined();
      expect(screen.getAllByText(/6698 Sayılı KVKK/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Ana Sayfaya ve Arama Tezgahına Dön/i)).toBeDefined();
    });

    it('has appropriate SEO metadata', () => {
      expect(gizlilikMeta.title).toContain('Gizlilik Politikası');
      expect(gizlilikMeta.description).toContain('6698 sayılı KVKK');
    });
  });

  describe('Kullanım Koşulları Page', () => {
    it('renders with official ÖSYM disclaimer and free usage notice', () => {
      render(<KullanimKosullariPage />);
      expect(screen.getByText(/Kullanım Koşulları ve Sorumluluk Reddi Beyanı/i)).toBeDefined();
      expect(screen.getByText(/Resmi Hukuki Dayanak Uyarısı/i)).toBeDefined();
      expect(screen.getByText(/tamamen ücretsiz/i)).toBeDefined();
    });

    it('has appropriate SEO metadata', () => {
      expect(kullanimMeta.title).toContain('Kullanım Koşulları');
      expect(kullanimMeta.description).toContain('yasal sorumluluk');
    });
  });

  describe('Custom 404 Page (not-found.tsx)', () => {
    it('renders official institutional 404 with error code and return button', () => {
      render(<NotFound />);
      expect(screen.getByText(/Hata 404/i)).toBeDefined();
      expect(screen.getByText(/Aradığınız Kayıt veya Sayfa Mevcut Değil/i)).toBeDefined();
      expect(screen.getByText(/Ana Sayfaya ve Arama Tezgahına Dön/i)).toBeDefined();
    });
  });

  describe('Cookie Consent Banner', () => {
    it('shows banner when no prior consent is stored in localStorage', () => {
      render(<CookieBanner />);
      expect(screen.getByRole('region', { name: /Çerez ve Gizlilik Tercihleri/i })).toBeDefined();
      expect(screen.getByText(/Tümünü Kabul Et/i)).toBeDefined();
      expect(screen.getByText(/Yalnızca Zorunlu Çerezler/i)).toBeDefined();
    });

    it('saves "accepted" in localStorage and hides on "Tümünü Kabul Et" click', () => {
      render(<CookieBanner />);
      const acceptBtn = screen.getByText(/Tümünü Kabul Et/i);
      fireEvent.click(acceptBtn);

      expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('accepted');
      expect(screen.queryByRole('region', { name: /Çerez ve Gizlilik Tercihleri/i })).toBeNull();
    });

    it('saves "essential_only" in localStorage and hides on "Yalnızca Zorunlu Çerezler" click', () => {
      render(<CookieBanner />);
      const essentialBtn = screen.getByText(/Yalnızca Zorunlu Çerezler/i);
      fireEvent.click(essentialBtn);

      expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('essential_only');
      expect(screen.queryByRole('region', { name: /Çerez ve Gizlilik Tercihleri/i })).toBeNull();
    });

    it('does not render if consent already exists in localStorage', () => {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      render(<CookieBanner />);
      expect(screen.queryByRole('region', { name: /Çerez ve Gizlilik Tercihleri/i })).toBeNull();
    });
  });

  describe('Privacy-Respecting Analytics Engine', () => {
    it('dispatches custom event kpss_analytics_event', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      trackEvent('search_department', { query: 'bilgisayar' });

      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('kpss_analytics_event');
      expect(event.detail.eventName).toBe('search_department');
      expect(event.detail.params.query).toBe('bilgisayar');
    });

    it('respects essential_only consent and suppresses analytics', () => {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'essential_only');
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      trackEvent('search_department', { query: 'test' });

      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Security Headers Configuration', () => {
    it('contains HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy', async () => {
      expect(nextConfig.headers).toBeDefined();
      if (typeof nextConfig.headers === 'function') {
        const headerRules = await nextConfig.headers();
        expect(headerRules.length).toBeGreaterThan(0);
        const globalRule = headerRules.find((r: { source: string }) => r.source === '/:path*');
        expect(globalRule).toBeDefined();

        const headerMap = Object.fromEntries(
          globalRule!.headers.map((h: { key: string; value: string }) => [h.key, h.value])
        );

        expect(headerMap['Strict-Transport-Security']).toContain('max-age=63072000');
        expect(headerMap['X-Frame-Options']).toBe('DENY');
        expect(headerMap['X-Content-Type-Options']).toBe('nosniff');
        expect(headerMap['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      }
    });
  });

  describe('Sitemap Coverage', () => {
    it('includes root, gizlilik-politikasi, and kullanim-kosullari', () => {
      const items = sitemap();
      const urls = items.map((i) => i.url);
      expect(urls.some((u) => u.endsWith('/'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/gizlilik-politikasi'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/kullanim-kosullari'))).toBe(true);
    });
  });
});
