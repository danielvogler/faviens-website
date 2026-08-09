export interface Strings {
  nav: {
    contact: string;
  };
  footer: {
    contact: string;
    rights: string;
  };
  hero: {
    eyebrow: string;
    slogan: string;
  };
  pages: {
    home: { title: string; description: string };
    notFound: { title: string; heading: string; lead: string; back: string };
  };
  cta: {
    eyebrow: string;
    headline: string;
    label: string;
  };
  languageSwitcher: {
    de: string;
    en: string;
    label: string;
  };
  a11y: {
    skipToContent: string;
  };
}

export const de: Strings = {
  nav: {
    contact: 'Kontakt',
  },
  footer: {
    contact: 'Kontakt',
    rights: 'Alle Rechte vorbehalten.',
  },
  hero: {
    eyebrow: 'Demnächst',
    slogan: 'KI, agentische KI, Analytics & Daten. Schweizer Beratung.',
  },
  pages: {
    home: {
      title: 'FAVIENS',
      description:
        'Schweizer Beratung für KI, agentische KI, Analytics und Daten. Website in Kürze verfügbar.',
    },
    notFound: {
      title: '404, FAVIENS',
      heading: '404',
      lead: 'Diese Seite existiert nicht.',
      back: 'Zur Startseite',
    },
  },
  cta: {
    eyebrow: 'Bereit zu starten?',
    headline: 'Sprechen wir über Ihr Projekt.',
    label: 'Kontakt aufnehmen →',
  },
  languageSwitcher: {
    de: 'DE',
    en: 'EN',
    label: 'Sprache wechseln',
  },
  a11y: {
    skipToContent: 'Direkt zum Inhalt',
  },
};
