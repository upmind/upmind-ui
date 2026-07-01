// -----------------------------------------------------------------------------
/**
 * @module account
 * @description Account module — the post-auth standing arc (unregistered →
 * unverified → verified), scoped by actor (client now, staff later).
 */

export { useAccount, type UseAccount } from "./useAccount";

// --- Scope matrix
export { ACCOUNT_SCOPE_MATRIX, AccountContextTypes } from "./account.types";
export type { AccountScopeMatrix } from "./account.types";

// --- Sub-composable type exports for consumers
export type { UseAccountActions } from "./useAccount.actions";
export type { UseAccountContext } from "./useAccount.context";
export type { UseAccountMeta } from "./useAccount.meta";
export type { UseAccountInternals } from "./useAccount.internals";

// --- Public form-model types
export type {
  CompleteRegistrationModel,
  GuestEmailModel,
  VerifyEmailModel
} from "./account.types";
export { ClientFormType } from "./account.types";
