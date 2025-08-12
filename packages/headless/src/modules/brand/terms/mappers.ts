// --- utils

// --- types
import type { TermsAndConditions } from "./types";
import type { ITermsAndConditions } from "@upmind-automation/types";
import { useTranslateField, useTranslateName } from "../../../utils";

// ---------------------------------------------------------------------------

/**
 * Parses the raw terms data and transforms it into a structured `TermsAndConditions` object.
 *
 * @param {ITermsAndConditions} raw - The raw terms data object, containing all the information
 * about a terms and conditions as received from the data source.
 *
 * @return {TermsAndConditions} The transformed and structured `TermsAndConditions` object containing
 * the relevant details from the raw data.
 */
export function parseTerm(raw: ITermsAndConditions): TermsAndConditions {
  // ---------------------------------------------------------------------------
  return {
    id: raw.id,
    title: useTranslateName(raw),
    content: useTranslateField(raw.terms, "terms"),
    url: useTranslateField(raw.terms, "url"),
    meta: {
      isUrl: !!raw.terms?.url
    }
  } as TermsAndConditions;
}
