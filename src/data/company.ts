/**
 * Legal facts, defined once. The Impressum and Datenschutz pages render from
 * here, so filling in a value updates both locales at once.
 *
 * TODO before the next deploy: `street`, `postalCode` and `uid` are unknown
 * until the company is registered. While `uid` is null the Impressum says the
 * commercial-register entry is pending, and while `street` is null the address
 * block falls back to the city alone. Both are honest placeholders, but a
 * Swiss Impressum is expected to carry a full address, so treat this as
 * incomplete until the registration comes through.
 */
export interface CompanyAddress {
  street: string | null;
  postalCode: string | null;
  city: string;
  country: string;
  countryCode: string;
}

export const COMPANY = {
  name: 'Faviens',
  /** Legal form. Update once the registration is filed. */
  legalForm: null as string | null,
  /** Swiss business identification number, CHE-xxx.xxx.xxx. */
  uid: null as string | null,
  address: {
    street: null,
    postalCode: null,
    city: 'Zürich',
    country: 'Schweiz',
    countryCode: 'CH',
  } as CompanyAddress,
  /** Overridden by the CONTACT_EMAIL environment variable where one is set. */
  email: 'hello@faviens.com',
} as const;

/** Address lines in postal order, skipping anything not yet known. */
export function addressLines(address: CompanyAddress): string[] {
  const locality = [address.postalCode, address.city].filter(Boolean).join(' ');
  return [address.street, locality, address.country].filter((line): line is string =>
    Boolean(line),
  );
}
