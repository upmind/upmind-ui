import { type GatewayData } from "@upmind-automation/types";
import type { GatewayContext } from "../types";

// -----------------------------------------------------------------------------

declare global {
  interface Window {
    dlocal: (apiKey: string) => DLocalInstance;
  }
}

export enum DLOCAL_FIELDS {
  SMART_FIELDS_KEY = "smartFieldsKey",
  TEST_MODE = "testMode"
}

/**
 * Currency code to ISO 3166-1 alpha-2 country code mapping.
 * dLocal requires the country code matching the billing currency
 * for correct tokenization. Used as fallback when no address country
 * is available (e.g. ADD context).
 */
export const CURRENCY_TO_COUNTRY: Record<string, string> = {
  ARS: "AR",
  AUD: "AU",
  BDT: "BD",
  BOB: "BO",
  BRL: "BR",
  CAD: "CA",
  CLP: "CL",
  CNY: "CN",
  COP: "CO",
  CRC: "CR",
  DOP: "DO",
  EGP: "EG",
  EUR: "DE",
  GBP: "GB",
  GHS: "GH",
  GTQ: "GT",
  HKD: "HK",
  HNL: "HN",
  IDR: "ID",
  INR: "IN",
  JPY: "JP",
  KES: "KE",
  KRW: "KR",
  MAD: "MA",
  MXN: "MX",
  MYR: "MY",
  NGN: "NG",
  NIO: "NI",
  NZD: "NZ",
  PAB: "PA",
  PEN: "PE",
  PHP: "PH",
  PKR: "PK",
  PYG: "PY",
  RWF: "RW",
  SGD: "SG",
  THB: "TH",
  TRY: "TR",
  TWD: "TW",
  TZS: "TZ",
  UGX: "UG",
  USD: "US",
  UYU: "UY",
  VND: "VN",
  XAF: "CM",
  XOF: "SN",
  ZAR: "ZA",
  ZMW: "ZM"
} as const;

/**
 * Country codes that require a personal identification document for dLocal payment.
 * Source: https://docs.dlocal.com/reference/country-reference
 */
export const DOCUMENT_REQUIRED_COUNTRIES = [
  // --- LATAM
  "AR", // Argentina — DNI, CUIT, CUIL
  "BO", // Bolivia — CI, NIT
  "BR", // Brazil — CPF, CNPJ
  "CL", // Chile — CI, RUT
  "CO", // Colombia — CC, NIT
  "CR", // Costa Rica — CI
  // "DO" removed: Dominican Republic's documented dLocal currency (DOP) does not require a document field
  "EC", // Ecuador — CI, RUC
  "GT", // Guatemala — CUI
  "HN", // Honduras — DNI
  "MX", // Mexico — CURP, RFC
  "NI", // Nicaragua — DNI
  // "PA" removed: Panama's documented dLocal currency (USD) does not require a document field
  "PE", // Peru — DNI, RUC
  "PY", // Paraguay — CI, RUC
  "SV", // El Salvador — DUI
  "UY", // Uruguay — CI, RUT
  "VE", // Venezuela — CI, RIF
  // --- Africa
  "CM", // Cameroon — CNI
  "CD", // DR Congo — National ID
  "EG", // Egypt — National ID
  "GH", // Ghana — Ghana Card
  "GW", // Guinea-Bissau — CEDEAO ID
  "KE", // Kenya — National ID / Maisha ID
  "MG", // Madagascar — National ID
  "MA", // Morocco — CNIE
  "NE", // Niger — CNI
  "NG", // Nigeria — NIN
  "RW", // Rwanda — National ID
  "SN", // Senegal — CNI / ECOWAS ID
  "TZ", // Tanzania — National ID
  "TD", // Chad — CNI
  "UG", // Uganda — NIC
  "ZA", // South Africa — SA Identity Card
  // "ZM" removed: Zambia's documented dLocal currency (ZMW) does not require a document field
  "ZW", // Zimbabwe — National ID
  // --- Middle East
  "AE", // UAE — Emirates ID
  "BH", // Bahrain — Smart Card / CPR
  "JO", // Jordan — National ID
  "OM", // Oman — National ID
  "SA", // Saudi Arabia — National ID
  // --- Asia & Pacific
  "CN", // China — Citizen ID
  "ID", // Indonesia — NIK
  "IN", // India — PAN (also requires phone)
  "JP", // Japan — My Number
  "MY", // Malaysia — NRIC
  "PH", // Philippines — PSN
  "PK", // Pakistan — CNIC
  "TH", // Thailand — Thai Identity Card
  "VN" // Vietnam — VNID
] as const;

/**
 * Country codes where phone is mandatory for payment.
 */
export const PHONE_REQUIRED_COUNTRIES = [
  "IN" // India — phone mandatory for fraud prevention
] as const;

/**
 * Per-country regex patterns for document validation.
 * Countries not listed here have no format constraint — only the `required` check applies.
 * Source: https://docs.dlocal.com/reference/country-reference
 */
export const DOCUMENT_REGEX_RULES: Record<string, RegExp> = {
  // --- LATAM
  AE: /^\d{15}$/, // Emirates ID: exactly 15 digits
  AR: /^(\d{7,9}|\d{11})$/, // DNI: 7–9 digits | CUIT/CUIL: 11 digits
  BH: /^\d{9}$/, // Smart Card / CPR: 9 digits
  BO: /^\d{5,20}$/, // CI: 5–20 digits
  BR: /^(\d{11}|\d{14})$/, // CPF: 11 digits | CNPJ: 14 digits
  CL: /^\d{8,9}$/, // CI/RUT: 8–9 digits
  CN: /^(\d{18}|\d{17}[Xx])$/, // Citizen ID: 18 digits or 17+X
  CO: /^\d{6,11}$/, // CC/NIT: 6–11 digits
  CR: /^\d{9}$/, // CI: exactly 9 digits
  EC: /^\d{5,20}$/, // CI/RUC: 5–20 digits
  EG: /^\d{14}$/, // National ID: 14 digits
  GH: /^[A-Z]{3}\d{10}$/, // Ghana Card: 3 letters + 10 digits
  GT: /^\d{13}$/, // CUI: 13 digits
  HN: /^\d{13}$/, // DNI: 13 digits
  ID: /^\d{16}$/, // NIK: 16 digits
  IN: /^[A-Z]{5}\d{4}[A-Z]$/, // PAN: 5 letters + 4 digits + 1 letter
  JO: /^\d{10}$/, // National ID: 10 digits
  JP: /^\d{12}$/, // My Number: 12 digits
  KE: /^\d{6,9}$/, // National ID / Maisha ID: 6–9 digits
  MG: /^\d{12}$/, // National ID: 12 digits
  MX: /^[A-Z0-9]{10,18}$/, // CURP: 10–18 chars | RFC: 12–13 chars
  MY: /^\d{12}$/, // NRIC: 12 digits
  NE: /^\d{7}$/, // CNI: 7 digits
  NG: /^\d{11}$/, // NIN: 11 digits
  NI: /^\d{13}[A-Z]$/, // DNI: 13 digits + 1 letter
  OM: /^\d{9}$/, // National ID: 9 digits
  PE: /^(\d{8,9}|\d{11})$/, // DNI: 8–9 digits | RUC: 11 digits
  PH: /^\d{12}$/, // PSN: 12 digits
  PK: /^\d{13}$/, // CNIC: 13 digits
  PY: /^\d{5,20}$/, // CI/RUC: 5–20 digits
  RW: /^\d{16}$/, // National ID: 16 digits
  SA: /^\d{10}$/, // National ID: 10 digits
  SN: /^\d{13,17}$/, // CNI / ECOWAS: 13–17 digits
  SV: /^\d{9}$/, // DUI: 9 digits
  TH: /^\d{13}$/, // Thai ID: 13 digits
  TZ: /^\d{20}$/, // National ID: 20 digits
  TD: /^\d{13}$/, // CNI: 13 digits
  UG: /^\d{14,17}$/, // NIC: 14–17 digits
  UY: /^(\d{6,8}|\d{12})$/, // CI: 6–8 digits | RUT: 12 digits
  VN: /^(\d{9}|\d{13})$/, // VNID: 9 or 13 digits
  ZA: /^\d{13}$/ // SA Identity Card: 13 digits
};

export type DLocalField = {
  mount: (container: HTMLElement | string) => void;
  on: (event: string, callback: (event: unknown) => void) => void;
  once?: (event: string, callback: (event: unknown) => void) => void;
  unmount: () => void;
};

export type DLocalFieldsFactory = {
  create: (
    type: "card" | "pan" | "cvv" | "expiration",
    options?: {
      style?: Record<string, unknown>;
      classes?: {
        base?: string;
        complete?: string;
        empty?: string;
        focus?: string;
        invalid?: string;
        webkitAutofill?: string;
      };
      placeholder?: string | Record<string, string>;
      iconStyle?: "solid" | "default";
      hideIcon?: boolean;
      maskInput?: boolean;
    }
  ) => DLocalField;
};

export type DLocalInstance = {
  fields: (options: {
    locale?: string;
    country: string;
  }) => DLocalFieldsFactory;
  createToken: (
    field: DLocalField,
    options: { name: string; document?: string; phone?: string }
  ) => Promise<{ token: string }>;
};

export type DLocalModel = GatewayData & {
  holder_name: string;
  payment_method_addition: {
    token?: string; // generated on pay
    document?: string;
    phone?: {
      /**
       * The full international phone number string, or `null`.
       */
      number: string | null;
      /**
       * The national number part of the phone number, or `null`.
       */
      nationalNumber: string | null;
      /**
       * The country calling code, or `null`.
       */
      countryCallingCode: string | null;
      /**
       * The two-letter ISO country code, or `null`.
       */
      country: string | null;
    };
  };
};

export type DLocalContext = GatewayContext<{
  sdk?: {
    dlocal: DLocalInstance;
    fields: Record<string, DLocalField>;
  };
  model?: DLocalModel;
}>;
