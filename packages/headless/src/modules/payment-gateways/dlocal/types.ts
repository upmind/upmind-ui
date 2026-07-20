// -----------------------------------------------------------------------------

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
