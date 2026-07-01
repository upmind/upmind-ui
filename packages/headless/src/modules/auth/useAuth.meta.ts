import { computed } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { contextMatches, useStateMatches } from "../../utils";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module auth/useAuth.meta
 * @description Auth meta factory.
 * Creates actor-aware meta composables based on actorScope.
 */

/**
 * Creates auth meta by selecting the appropriate implementation based on actorScope.
 * @internal
 */
export function createAuthMeta(actorScope: ScopeActorTypes, actor: UseActor) {
  const { state } = actor;

  // --- Shared meta flags (all actors)
  const isAvailable = useStateMatches(state, ["idle"]);
  const showLoginForm = useStateMatches(state, "login");
  const show2fa = useStateMatches(state, [
    "login.challenging",
    "login.verifying"
  ]);
  const is2faRequired = useStateMatches(state, "login.challenging");
  const isAuthenticated = useStateMatches(state, "authenticated");
  const isAuthenticating = useStateMatches(state, [
    "login.processing.authenticating"
  ]);
  const isChecking = useStateMatches(state, [
    "login.available.checking",
    "login.processing.checking",
    "register.available.checking",
    "register.processing.checking",
    "recover.available.checking",
    "recover.processing.checking"
  ]);
  const hasErrors = useStateMatches(state, [
    "login.available.error",
    "register.available.error",
    "recover.available.error"
  ]);
  const isIdle = useStateMatches(state, "idle");
  const isLoading = useStateMatches(state, ["checking", "register.loading"]);
  const isRegisteringAsGuest = useStateMatches(state, "registeringGuest");
  const isProcessing = useStateMatches(state, [
    "login.processing.authenticating",
    "login.verifying",
    "register.processing.registering",
    "register.processing.authenticating",
    "recover.processing.recovering"
  ]);
  const isValid = useStateMatches(state, [
    "login.available.valid",
    "register.available.valid",
    "recover.available.valid"
  ]);

  // --- Capability flags (determined by actor scope AND auth state)
  // Can't login/register/recover if already authenticated
  const canLogin = computed(() => !isAuthenticated.value);
  const canRegister = computed(
    () => !isAuthenticated.value && !contextMatches(state, "scopeContext")
  );
  const canRecover = computed(
    () => !isAuthenticated.value && !contextMatches(state, "scopeContext")
  );
  const canRegisterAsGuest = computed(
    () =>
      !!useBrand().getConfigValue<boolean>(
        BrandConfigKeys.GUEST_CHECKOUT_ENABLED
      )
  );

  // --- Form visibility (actor-aware)
  // Staff can't access register/recover, so these are always false for staff
  const showRegisterForm = useStateMatches(state, "register");
  const showRecoverPasswordForm = useStateMatches(state, "recover");

  const canShowForms = computed(
    () =>
      isIdle.value ||
      showLoginForm.value ||
      showRegisterForm.value ||
      showRecoverPasswordForm.value
  );

  return {
    /** True if actor can login (false when already authenticated). */
    canLogin,

    /** True if actor can recover password (client only, false when authenticated). */
    canRecover,

    /** True if actor can register (client only, false when authenticated). */
    canRegister,

    /** True if guest registration is enabled for this brand. */
    canRegisterAsGuest,

    /** True if any auth form (idle/login/register/recover) is active. */
    canShowForms,

    /** True if any auth flow has validation errors. */
    hasErrors,

    /** True if 2FA verification is required. */
    is2faRequired,

    /** True if user is authenticated. */
    isAuthenticated,

    /** True if currently authenticating with credentials. */
    isAuthenticating,

    /** True if auth state machine is in a state where auth actions can be performed (e.g., not loading). */
    isAvailable,

    /** True if form is being validated. */
    isChecking,

    /** True if no auth flow is active. */
    isIdle,

    /** True if loading lookup data (e.g., custom fields for register). */
    isLoading,

    /** True if an API operation is in progress. */
    isProcessing,

    /** True while the two-step guest registration (M5) is in flight. */
    isRegisteringAsGuest,

    /** True if form data is valid and ready to submit. */
    isValid,

    /** True if 2FA input should be shown. */
    show2fa,

    /** True if login form should be shown. */
    showLoginForm,

    /** True if recover password form should be shown (client only). */
    showRecoverPasswordForm,

    /** True if register form should be shown (client only). */
    showRegisterForm
  };
}

// Type export for consumers
export type UseAuthMeta = ReturnType<typeof createAuthMeta>;
