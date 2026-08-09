export interface LegalSection {
  heading: string;
  body: string[];
}

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
  cta: {
    eyebrow: string;
  };
  pages: {
    home: { title: string; description: string };
    notFound: { title: string; heading: string; lead: string; back: string };
    imprint: {
      title: string;
      description: string;
      heading: string;
      responsibleHeading: string;
      contactHeading: string;
      registerHeading: string;
      registerPending: string;
      sections: LegalSection[];
    };
    privacy: {
      title: string;
      description: string;
      heading: string;
      lead: string;
      updated: string;
      sections: LegalSection[];
    };
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
    descriptor: 'Agentic-AI-Beratung · Zürich',
    status: 'Demnächst',
    lead: 'Faviens ist eine Beratung für agentische KI mit Sitz in Zürich. Der vollständige Auftritt folgt in Kürze.',
  },
  cta: {
    eyebrow: 'Kontakt',
  },
  pages: {
    home: {
      title: 'Faviens',
      description:
        'Beratung für agentische KI in Zürich. Der vollständige Auftritt folgt in Kürze.',
    },
    notFound: {
      title: '404, Faviens',
      heading: '404',
      lead: 'Diese Seite existiert nicht.',
      back: 'Zur Startseite',
    },
    imprint: {
      title: 'Impressum, Faviens',
      description: 'Impressum und Kontaktangaben von Faviens, Zürich.',
      heading: 'Impressum',
      responsibleHeading: 'Verantwortlich für den Inhalt',
      contactHeading: 'Kontakt',
      registerHeading: 'Handelsregister',
      registerPending: 'Der Handelsregistereintrag ist in Vorbereitung.',
      sections: [
        {
          heading: 'Haftung für Inhalte',
          body: [
            'Die Inhalte dieser Website wurden mit Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen.',
          ],
        },
        {
          heading: 'Haftung für Links',
          body: [
            'Diese Website enthält Verweise auf Websites Dritter. Auf deren Inhalte haben wir keinen Einfluss und übernehmen dafür keine Verantwortung. Für den Inhalt verlinkter Seiten ist stets deren Betreiberin oder Betreiber verantwortlich.',
          ],
        },
        {
          heading: 'Urheberrecht',
          body: [
            'Die auf dieser Website veröffentlichten Inhalte unterliegen dem schweizerischen Urheberrecht. Jede Verwendung ausserhalb der Grenzen des Urheberrechts bedarf der vorherigen schriftlichen Zustimmung.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Datenschutz, Faviens',
      description: 'Datenschutzerklärung von Faviens: keine Cookies, kein Tracking, keine Analyse.',
      heading: 'Datenschutzerklärung',
      lead: 'Diese Website setzt keine Cookies, bindet keine Werbe- oder Analysedienste ein und erstellt keine Nutzungsprofile.',
      updated: 'Stand: August 2026',
      sections: [
        {
          heading: 'Verantwortliche Stelle',
          body: [
            'Verantwortlich für die Bearbeitung von Personendaten auf dieser Website ist Faviens, Zürich. Die Kontaktangaben finden Sie im Impressum.',
          ],
        },
        {
          heading: 'Welche Daten bearbeitet werden',
          body: [
            'Beim Aufruf dieser Website werden durch den Hosting-Anbieter technisch notwendige Daten in Server-Logdateien erfasst. Dazu gehören die IP-Adresse des anfragenden Geräts, Datum und Uhrzeit des Zugriffs, die abgerufene Adresse sowie der übermittelte Browsertyp und das Betriebssystem.',
            'Diese Bearbeitung ist für den sicheren und stabilen Betrieb der Website erforderlich. Wir führen diese Daten nicht mit anderen Datenquellen zusammen und werten sie nicht personenbezogen aus.',
          ],
        },
        {
          heading: 'Hosting',
          body: [
            'Diese Website wird als statische Seite über GitHub Pages ausgeliefert, einen Dienst der GitHub, Inc., 88 Colin P Kelly Jr Street, San Francisco, CA 94107, USA. Dabei können Daten in die Vereinigten Staaten übermittelt werden.',
            'Die Schriftarten werden von unserem eigenen Server geladen. Beim Besuch dieser Website wird keine Verbindung zu Google Fonts oder einem anderen externen Anbieter aufgebaut.',
          ],
        },
        {
          heading: 'Cookies, Tracking und Analyse',
          body: [
            'Diese Website verwendet keine Cookies, kein Web-Analyse-Werkzeug, keine Social-Media-Plugins und keine Einbettungen von Drittanbietern. Ein Cookie-Banner ist deshalb nicht erforderlich.',
          ],
        },
        {
          heading: 'Kontaktaufnahme',
          body: [
            'Wenn Sie uns per E-Mail kontaktieren, bearbeiten wir Ihre Angaben ausschliesslich zur Bearbeitung Ihrer Anfrage und für allfällige Anschlussfragen. Wir geben diese Daten nicht ohne Ihre Einwilligung weiter.',
          ],
        },
        {
          heading: 'Ihre Rechte',
          body: [
            'Sie haben im Rahmen des schweizerischen Datenschutzgesetzes und, soweit anwendbar, der DSGVO das Recht auf Auskunft über die zu Ihrer Person bearbeiteten Daten sowie auf deren Berichtigung, Löschung oder Einschränkung der Bearbeitung. Wenden Sie sich dafür an die im Impressum genannte Adresse.',
          ],
        },
        {
          heading: 'Änderungen',
          body: [
            'Wir können diese Datenschutzerklärung jederzeit anpassen, insbesondere wenn sich der Funktionsumfang der Website ändert. Es gilt die jeweils auf dieser Seite veröffentlichte Fassung.',
          ],
        },
      ],
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
