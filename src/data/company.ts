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
  /** Fallback for {@link CONTACT_EMAIL}. Render that, never this. */
  email: 'info@faviens.com',
} as const;

/**
 * The contact address as rendered, everywhere. The `CONTACT_EMAIL` environment
 * variable wins where one is set, otherwise the address in `COMPANY`.
 *
 * `||` and not `??`: an unset GitHub Actions secret expands to an empty string,
 * which is not nullish, so `??` would let the empty value through.
 */
export const CONTACT_EMAIL: string = import.meta.env.CONTACT_EMAIL || COMPANY.email;

/** Address lines in postal order, skipping anything not yet known. */
export function addressLines(address: CompanyAddress): string[] {
  const locality = [address.postalCode, address.city].filter(Boolean).join(' ');
  return [address.street, locality, address.country].filter((line): line is string =>
    Boolean(line),
  );
}
