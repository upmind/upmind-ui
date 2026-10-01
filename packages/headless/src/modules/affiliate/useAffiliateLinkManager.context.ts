import { computed } from "vue";
import { contextValue, useContext } from "../../utils";
import { compact, map } from "lodash-es";
import type {
  AffiliateLinkFormModel,
  AffiliateLinkManagerContext
} from "./affiliate.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkManager.context
 * @description Manager context — the reactive read side of the machine
 * context (design.md §8.6).
 */
export function createAffiliateLinkManagerContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  return {
    /** The pinned account (design.md §8.4, Editors). */
    accountId: useContext<AffiliateLinkManagerContext["accountId"]>(
      state,
      "accountId"
    ),

    /** The brand name of the module-owned self read (design.md §8.6, DI-11). */
    brandName: useContext<AffiliateLinkManagerContext["brandName"]>(
      state,
      "brandName"
    ),

    /** `AFFILIATES_DEFAULT_REDIRECT_LINK` — seeds the create door only. */
    defaultRedirectUrl: useContext<
      AffiliateLinkManagerContext["defaultRedirectUrl"]
    >(state, "defaultRedirectUrl"),

    /**
     * @decision `errors` folds a 422's per-field messages (`error.data.<field>`,
     * parsed to `ErrorObject[]` by `useValidationParser`) ahead of the
     * top-level `error.message`.
     * what: joins every parsed field `message`, falling back to
     *      `error.message` only when the parser yields nothing.
     * why: the recorded 422 captures carry the useful text on the field
     *      (`data.redirect_url: ["The redirect url field is required."]`),
     *      not on the envelope (`"API request invalid!"`) — the prior
     *      `error.message`-only read surfaced the generic envelope text and
     *      dropped the field message the caller needs (F-3).
     * rejected: leaving `errors` as `error.message` and pointing callers at
     *      `validationErrors` instead — `errors` is this module's one public
     *      failure-message surface (`useMeta().hasError`'s sibling); adding a
     *      second required read for the common case is the defect, not a fix.
     */
    errors: computed(() => {
      const error = contextValue<AffiliateLinkManagerContext["error"]>(
        state,
        "error"
      );
      const fieldMessages = compact(
        map(error?.data as ErrorObject[] | undefined, detail => detail.message)
      );

      return fieldMessages.length ? fieldMessages.join(" ") : error?.message;
    }),

    /** The id of the link being managed (undefined for a new link). */
    id: useContext<string | undefined>(state, "id"),

    /** The current form model. */
    model: useContext<AffiliateLinkFormModel | undefined>(state, "model"),

    /** The JSON schema for the form. */
    schema: useContext<AffiliateLinkManagerContext["schema"]>(state, "schema"),

    /** The UI schema for the form. */
    uischema: useContext<AffiliateLinkManagerContext["uischema"]>(
      state,
      "uischema"
    ),

    /** Field-level validation errors — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")
  };
}

export type UseAffiliateLinkManagerContext = ReturnType<
  typeof createAffiliateLinkManagerContext
>;
