// --- external

// --- internal

// --- utils
import { includes } from "lodash-es";

// --- types
import type { GatewayContext } from "../types";
import { DOCUMENT_REQUIRED_COUNTRIES, PHONE_REQUIRED_COUNTRIES } from "./types";

// -----------------------------------------------------------------------------

/**
 * Returns the billing country code from the gateway context.
 */
export function getCountry(context: GatewayContext): string | undefined {
  return context.address?.country?.code;
}

/**
 * Whether the given country requires a personal identification document
 * (e.g. CPF in Brazil, DNI in Argentina) for dLocal payments.
 */
export function needsDocument(country: string | undefined): boolean {
  if (!country) return false;
  return includes(DOCUMENT_REQUIRED_COUNTRIES, country.toUpperCase());
}

/**
 * Whether the given country requires a phone number for dLocal payments
 * (e.g. India mandates phone for fraud prevention).
 */
export function needsPhone(country: string | undefined): boolean {
  if (!country) return false;
  return includes(PHONE_REQUIRED_COUNTRIES, country.toUpperCase());
}
