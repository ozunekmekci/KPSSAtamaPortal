import React from 'react';

export default function SeoStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kpssportal.pages.dev';

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KPSS Atama ve Nitelik Kodu Portalı',
    url: siteUrl,
    description:
      '2024-2026 KPSS B Grubu merkezi yerleştirme kadroları, lisans, önlisans ve ortaöğretim taban puanları, nitelik kodu arama ve bölüm eşleştirme portalı.',
    inLanguage: 'tr-TR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'KPSS Merkezi Yerleştirme ve Nitelik Kodu Portalı',
    url: siteUrl,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description:
      'KPSS merkezi atamalarında mezun olduğunuz bölüme göre ÖSYM nitelik kodlarını ve 81 il kadro taban puanlarını analiz eden etkileşimli portal.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
    },
    provider: {
      '@type': 'Organization',
      name: 'Kamu Görevlerine İlk Defa Atanacaklar İçin Tercih ve Analiz Masası',
      url: siteUrl,
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'KPSS 4001 nitelik kodu nedir ve kimler tercih edebilir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '4001 nitelik kodu, "Herhangi bir lisans programından mezun olmak" şartıdır. Üniversitelerin 4 yıllık herhangi bir lisans bölümünden mezun olan ve KPSSP3 puan türüne sahip tüm adaylar bu kadroları tercih edebilir.',
        },
      },
      {
        '@type': 'Question',
        name: 'KPSS 3001 nitelik kodu ne anlama gelir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '3001 nitelik kodu, "Herhangi bir önlisans programından mezun olmak" şartıdır. Meslek yüksekokulu veya 2 yıllık ön lisans bölümlerinin herhangi birinden mezun olup KPSSP93 puanı bulunan tüm adaylar 3001 kadrolarına başvurabilir.',
        },
      },
      {
        '@type': 'Question',
        name: 'KPSS 2001 nitelik kodu hangi adayları kapsar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '2001 nitelik kodu, "Ortaöğretim kurumlarının herhangi bir alanından mezun olmak" şartıdır. Düz lise, meslek lisesi veya imam hatip lisesi fark etmeksizin tüm lise mezunları KPSSP94 puanıyla bu kadroları yazabilir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Mezun olduğum bölümün KPSS nitelik kodunu nasıl öğrenirim?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Portalımızdaki Akıllı Arama alanına mezun olduğunuz bölümün adını (örneğin "Bilgisayar Mühendisliği" veya "Hemşirelik") yazarak ÖSYM sistemindeki 4 haneli branş nitelik kodunuzu, 4001/3001/2001 genel kodlarınızı ve eşdeğer bölümleri otomatik olarak listeleyebilirsiniz.',
        },
      },
      {
        '@type': 'Question',
        name: 'KPSS atama taban puanları nasıl belirlenir ve ne sıklıkla güncellenir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Merkezi yerleştirme taban puanları, ÖSYM tarafından her yerleştirme dönemi (2024/1, 2024/2, 2025/1 vb.) sonunda kadroya yerleşen en son adayın puanı esas alınarak virgülden sonra 5 ondalık basamak hassasiyetiyle belirlenir ve portalımızda anında analiz edilir.',
        },
      },
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'KPSS Atama ve Nitelik Kodu Arama',
        item: `${siteUrl}/#results-section`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
