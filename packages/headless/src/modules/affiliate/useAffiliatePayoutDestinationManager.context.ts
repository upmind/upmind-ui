import { useContext } from "../../utils";
import type {
  AffiliatePayoutDestinationFormModel,
  AffiliatePayoutDestinationManagerContext
} from "./affiliate.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliatePayoutDestinationManager.context
 * @description Manager context — the reactive read side of the machine
 * context (design.md §8.6).
 */
export function createAffiliatePayoutDestinationManagerContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  return {
    /** The pinned account (design.md §8.4, Editors). */
    accountId: useContext<
      AffiliatePayoutDestinationManagerContext["accountId"]
    >(state, "accountId"),

    /** The brand's payout destinations (AC22). */
    destinations: useContext<
      AffiliatePayoutDestinationManagerContext["destinations"]
    >(state, "destinations"),

    /** The client's unpaged emails (AC23). */
    emails: useContext<AffiliatePayoutDestinationManagerContext["emails"]>(
      state,
      "emails"
    ),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The current form model. */
    model: useContext<AffiliatePayoutDestinationFormModel | undefined>(
      state,
      "model"
    ),

    /** The JSON schema for the form. */
    schema: useContext<AffiliatePayoutDestinationManagerContext["schema"]>(
      state,
      "schema"
    ),

    /** The UI schema for the form. */
    uischema: useContext<AffiliatePayoutDestinationManagerContext["uischema"]>(
      state,
      "uischema"
    ),

    /** Field-level validation errors — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")
  };
}

export type UseAffiliatePayoutDestinationManagerContext = ReturnType<
  typeof createAffiliatePayoutDestinationManagerContext
>;
