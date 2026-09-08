// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/profile-context
 * @description What `client-personal-details`'s own `useSchema` /
 * `useUischema` are handed (plan F3) — the module's `ProfileContext`, built
 * from the live dataset. The schema is the REAL module's, unchanged; only who
 * answers the submit is the mock's, which is the whole point of the form
 * phase.
 *
 * `filterFields` names the four native fields alone. The brand's custom
 * fields are a form of their own (plan §3, phase F1) and their definitions
 * are not seeded yet, so naming them here would render a panel of nothing.
 */

import { PORTAL_FORM_LANGUAGES } from "./engine-data";
import type { MockDataset } from "../types";
import type { ProfileContext } from "@upmind-automation/headless";

/** The native fields legacy's profile form carries — the schema's own key order. */
export const PROFILE_FIELDS: readonly string[] = [
  "firstName",
  "lastName",
  "publicName",
  "language"
];

export function profileFormContext(data: MockDataset): ProfileContext {
  const { persona } = data;
  return {
    id: persona.id,
    lookups: {
      languages: [...PORTAL_FORM_LANGUAGES],
      fields: [],
      filterFields: [...PROFILE_FIELDS]
    },
    model: {
      firstName: persona.firstName,
      lastName: persona.lastName,
      publicName: persona.publicName,
      language: persona.language
    }
  };
}
