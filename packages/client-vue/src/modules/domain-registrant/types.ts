// -----------------------------------------------------------------------------
/**
 * @module domain-registrant/types
 * @description Type definitions for domain registrant module.
 */

// -----------------------------------------------------------------------------

/**
 * Registrant data extracted from provision fields.
 */
export type RegistrantData = {
  name?: string;
  organisation?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

/**
 * Status of a domain product for display.
 */
export type DomainRegistrantStatus = {
  /** Basket product ID. */
  productId: string;
  /** Domain name (from serviceIdentifier). */
  domain: string;
  /** Whether all required registrant fields are complete. */
  isComplete: boolean;
  /** Extracted registrant data. */
  registrant: RegistrantData;
};

/**
 * Props for DomainRegistrantCard component.
 */
export type DomainRegistrantCardProps = {
  status: DomainRegistrantStatus;
};

/**
 * Props for RegistrantFormInline component.
 */
export type DomainRegistrantFormInlineProps = {
  productId: string;
  domain: string;
};

/**
 * Props for RegistrantField component.
 */
export type RegistrantFieldProps = {
  label: string;
  value?: string;
  required?: boolean;
};
