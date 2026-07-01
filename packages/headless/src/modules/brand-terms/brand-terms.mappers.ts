/** @internal */
import { useTranslateField, useTranslateName } from "../../utils";
import { isNil } from "lodash-es";
import type { TermsAndConditions } from "./brand-terms.types";
import type { ITermsAndConditions } from "@upmind-automation/types";

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
  if (isNil(raw)) return {} as TermsAndConditions;
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
