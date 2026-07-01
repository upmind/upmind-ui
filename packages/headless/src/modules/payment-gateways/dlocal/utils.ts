import { DOCUMENT_REQUIRED_COUNTRIES, PHONE_REQUIRED_COUNTRIES } from "./types";
import { includes } from "lodash-es";
import type { GatewayContext } from "../payment-gateways.types";

// -----------------------------------------------------------------------------

/**
 * Returns the billing country code from the gateway context.
 */
export function getCountry(context: GatewayContext): string | undefined {
  return context.address?.country?.code;
}

/**
 * Returns the billing currency code from the gateway context.
 */
export function getCurrency(context: GatewayContext): string | undefined {
  return context.currency?.code;
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

/**
 * Returns the country-specific document name for a given country+currency
 * combination, per dLocal's country reference. These are region-specific
 * abbreviations that must not be translated.
 * @see https://docs.dlocal.com/reference/country-reference#general-information
 */
export function getDocumentName(
  country: string | undefined,
  currency: string | undefined
): string {
  if (!country || !currency) return "Document";
  const key = `${country.toUpperCase()}_${currency.toUpperCase()}`;

  switch (key) {
    case "AR_ARS":
      return "DNI / CUIT / CUIL";
    case "BH_BHD":
      return "Smart Card / CPR";
    case "BD_BDT":
      return "NID Card";
    case "BO_BOB":
      return "CI / NIT";
    case "BR_BRL":
      return "CPF / CNPJ";
    case "CM_XAF":
      return "CNI / ID";
    case "TD_XAF":
      return "CNI";
    case "CL_CLP":
      return "CI / RUT";
    case "CN_CNY":
      return "Citizen ID Number";
    case "CO_COP":
      return "CC / NIT";
    case "CR_CRC":
      return "CI";
    case "CD_CDF":
      return "National ID Card";
    case "DO_DOP":
      return "ID";
    case "EC_USD":
      return "CI";
    case "SV_USD":
      return "DUI";
    case "EG_EGP":
      return "ID";
    case "GH_GHS":
      return "Ghana Card";
    case "GT_GTQ":
      return "CUI";
    case "GW_XOF":
      return "CEDEAO National ID Card";
    case "HN_HNL":
      return "DNI";
    case "IN_INR":
      return "PAN";
    case "ID_IDR":
      return "NIK";
    case "CI_XOF":
      return "CNI";
    case "JP_JPY":
      return "My Number";
    case "JO_JOD":
      return "National ID Card";
    case "KE_KES":
      return "National ID Card";
    case "MG_MGA":
      return "National ID Card";
    case "MY_MYR":
      return "NRIC";
    case "MX_MXN":
      return "CURP / RFC";
    case "MA_MAD":
      return "CNIE";
    case "NI_NIO":
      return "DNI";
    case "NE_XOF":
      return "CNI";
    case "NG_NGN":
      return "NIN";
    case "OM_OMR":
      return "National ID Card";
    case "PK_PKR":
      return "CNIC";
    case "PA_USD":
      return "Cedula de Identidad";
    case "PY_PYG":
      return "CI";
    case "PE_PEN":
      return "DNI / RUC";
    case "PH_PHP":
      return "PSN";
    case "RW_RWF":
      return "National ID Card";
    case "SA_SAR":
      return "National ID Card";
    case "SN_XOF":
      return "CNI / ECOWAS ID";
    case "ZA_ZAR":
      return "SA Identity Card";
    case "LK_LKR":
      return "National ID Card";
    case "TZ_TZS":
      return "National ID Card";
    case "TH_THB":
      return "Thai Identity Card";
    case "TR_TRY":
      return "T.C. Kimlik No.";
    case "UG_UGX":
      return "NIC";
    case "AE_AED":
      return "Emirates ID";
    case "UY_UYU":
      return "CI / RUT";
    case "VN_VND":
      return "VNID";
    case "ZM_ZMW":
      return "National Registration Card";
    case "ZW_ZWL":
      return "National ID Card";
    default:
      return "Document";
  }
}
