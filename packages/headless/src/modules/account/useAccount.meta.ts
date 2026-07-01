import { computed } from "vue";
import { ClientFormType } from "./account.types";
import { useContext, useStateMatches } from "../../utils";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module account/useAccount.meta
 * @description Account meta factory (state flags).
 */

/**
 * Creates account meta (computed state flags).
 * @internal
 */
export function createAccountMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  // --- form-surface flags
  const formType = useContext<ClientFormType>(state, "formType");
  const isUnregistered = useStateMatches(state, "available.unregistered");

  const canResend = useStateMatches(
    state,
    "available.unverified.resend.available"
  );
  const hasErrors = useStateMatches(state, [
    "available.unregistered.error",
    "available.unverified.challenging.error",
    "available.unverified.resend.error"
  ]);
  const isCompletingRegistration = useStateMatches(
    state,
    "available.unregistered.registering"
  );
  const isProcessing = useStateMatches(state, [
    "available.unverified.challenging.verifying",
    "available.unregistered.registering",
    "available.unregistered.updating",
    "available.unverified.resend.processing"
  ]);
  const isResending = useStateMatches(
    state,
    "available.unverified.resend.processing"
  );
  const resendComplete = useStateMatches(
    state,
    "available.unverified.resend.complete"
  );
  const resendFailed = useStateMatches(
    state,
    "available.unverified.resend.error"
  );
  const showGuestEmailForm = computed(
    () => isUnregistered.value && formType.value === ClientFormType.EMAIL
  );
  const showGuestUpgradeForm = computed(
    () => isUnregistered.value && formType.value === ClientFormType.REGISTER
  );
  const showVerifyEmailForm = useStateMatches(
    state,
    "available.unverified.challenging"
  );

  const canShowForms = computed(
    () =>
      showGuestUpgradeForm.value ||
      showVerifyEmailForm.value ||
      showGuestEmailForm.value
  );

  // -----------------------------------------------------------------------------
  return {
    /** True while the resend cooldown is idle and a resend can be triggered. */
    canResend,

    /** True if any account form (guest-upgrade/verify/guest-email) is active. */
    canShowForms,

    /** True if the account form (upgrade/verify/resend) has errors. */
    hasErrors,

    /** True while the guest-upgrade (completeRegistration) request is in flight. */
    isCompletingRegistration,

    /** True if the client is an unregistered guest. */
    isGuest: isUnregistered,

    /** True while an account request (verify/upgrade/email/resend) is in flight. */
    isProcessing,

    /** True while a verification email is being resent. */
    isResending,

    /** True once a verification email resend has completed. */
    resendComplete,

    /** True if the last verification email resend failed. */
    resendFailed,

    /** True if the guest order-receipt email form is active. */
    showGuestEmailForm,

    /** True if the guest-upgrade (register) form is active. */
    showGuestUpgradeForm,

    /** True if the email-verification challenge form is active. */
    showVerifyEmailForm
  };
}

// Type export for consumers
export type UseAccountMeta = ReturnType<typeof createAccountMeta>;
