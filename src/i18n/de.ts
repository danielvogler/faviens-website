export interface Strings {
  footer: {
    contact: string;
    legal: string;
    location: string;
    pronunciationLabel: string;
    pronunciation: string;
    pronunciationIpa: string;
    rights: string;
  };
  hero: {
    descriptor: string;
    status: string;
    lead: string;
  };
  name: {
    number: string;
    heading: string;
    /** Approved brand answer (handoff §1). "blends" and "derived from" are
     *  accurate; never write that the name "means" anything. */
    body: string;
  };
  cta: {
    eyebrow: string;
  };
  pages: {
    home: { title: string; description: string };
    notFound: { title: string; heading: string; lead: string; back: string };
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
  footer: {
    contact: 'Kontakt',
    legal: 'Rechtliches',
    location: 'Zürich, Schweiz',
    pronunciationLabel: 'Aussprache',
    pronunciation: 'FAH-vee-ens',
    pronunciationIpa: '/ˈfɑːviˌɛns/',
    rights: 'Alle Rechte vorbehalten.',
  },
  hero: {
    descriptor: 'Agentic-AI-Beratung — Zürich',
    status: 'Demnächst',
    lead: 'Faviens ist eine Beratung für agentische KI mit Sitz in Zürich. Der vollständige Auftritt folgt in Kürze.',
  },
  name: {
    number: '01',
    heading: 'Der Name',
    body: 'Der Name verbindet zwei lateinische Wörter: favere, zugunsten von jemandem handeln, und agens, der Handelnde.',
  },
  cta: {
    eyebrow: 'Kontakt',
  },
  pages: {
    home: {
      title: 'Faviens',
      description:
        'Faviens — Beratung für agentische KI in Zürich. Der vollständige Auftritt folgt in Kürze.',
    },
    notFound: {
      title: '404 — Faviens',
      heading: '404',
      lead: 'Diese Seite existiert nicht.',
      back: 'Zur Startseite',
    },
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
