import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import manifest from '@/app/manifest';
import React from 'react';
import { render } from '@testing-library/react';
import SeoStructuredData from '@/components/SeoStructuredData';

describe('SEO Architecture & Metadata Verification', () => {
  it('generates valid robots.txt configuration', () => {
    const r = robots();
    expect(r.rules).toBeDefined();
    expect(r.sitemap).toContain('/sitemap.xml');
    
    // Check allow and disallow rules
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules.userAgent).toBe('*');
    expect(rules.allow).toBe('/');
    expect(rules.disallow).toContain('/api/');
  });

  it('generates valid XML sitemap entries', () => {
    const s = sitemap();
    expect(Array.isArray(s)).toBe(true);
    expect(s.length).toBeGreaterThan(0);
    
    const rootEntry = s[0];
    expect(rootEntry.url).toBeDefined();
    expect(rootEntry.priority).toBe(1.0);
    expect(rootEntry.changeFrequency).toBe('daily');
    expect(rootEntry.lastModified).toBeInstanceOf(Date);
  });

  it('generates valid web application manifest', () => {
    const m = manifest();
    expect(m.name).toBe('T.C. KPSS Atama ve Nitelik Kodu Portalı');
    expect(m.short_name).toBe('KPSS Portal');
    expect(m.display).toBe('standalone');
    expect(m.theme_color).toBe('#b91c1c');
    expect(m.background_color).toBe('#f8fafc');
    expect(m.icons?.length).toBeGreaterThan(0);
  });

  it('renders valid Schema.org JSON-LD scripts (WebSite, WebApp, FAQPage, Breadcrumbs)', () => {
    const { container } = render(<SeoStructuredData />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    
    expect(scripts.length).toBe(4);
    
    const parsedSchemas = Array.from(scripts).map((script) => {
      expect(script.textContent).toBeTruthy();
      return JSON.parse(script.textContent || '{}');
    });

    const types = parsedSchemas.map((s) => s['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('WebApplication');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');

    // Verify FAQ schema has rich question answers
    const faqSchema = parsedSchemas.find((s) => s['@type'] === 'FAQPage');
    expect(faqSchema.mainEntity.length).toBeGreaterThanOrEqual(4);
    expect(faqSchema.mainEntity[0].name).toContain('4001');
    expect(faqSchema.mainEntity[0].acceptedAnswer.text).toBeTruthy();
  });
});
