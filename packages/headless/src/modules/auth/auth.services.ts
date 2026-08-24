/** @internal */
import { t, type AnyEventObject } from "xstate";
import { ScopeActorTypes } from "../scope";
import { useSessionStore } from "../session-store";
import { createClientAuthServices } from "./auth.services.client";
import { createGuestAuthServices } from "./auth.services.guest";
import { createStaffAuthServices } from "./auth.services.staff";
import { AuthContextTypes } from "./auth.types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../utils";
import { first, isEmpty, values } from "lodash-es";
import type {
  AuthContext,
  AuthModel,
  LoginModel,
  TwoFAModel,
  RegisterModel,
  RecoverModel,
  AuthServices
} from "./auth.types";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module auth/services
 * @description Auth services factory.
 * Shared services are defined here, scopeActor-specific services in their respective files.
 * Uses a matrix lookup pattern for scalable service resolution.
 *
 * WARNING: Do not import directly. Use via auth machine only.
 */
// -----------------------------------------------------------------------------
// Shared Services
// These are identical for all scopeActor types

/**
 * Check if there's already an authenticated session for the current scope.
 * Uses the session store as source of truth.
 *
 * When scopeContext is provided (e.g., staff acting for a specific client),
 * checks for a session matching that specific context entity rather than
 * any session for the actor type.
 *
 * Without scopeContext:
 * - Staff scope: authenticated if staffSessions has any entries
 * - Client scope: authenticated if clientSessions has any entries
 * - Guest/Self scope: authenticated if ANY authenticated session exists
 *
 * NOTE: Guest sessions are NOT considered authenticated - only client/staff sessions.
 */
export async function checkSession(
  context: AuthContext,
  _event: AnyEventObject
): Promise<{ session: IToken }> {
  const { scopeActor, scopeContext } = context;
  const { useContext } = useSessionStore();
  const { staffSessions, clientSessions } = useContext();

  let session: IToken | null | undefined;

  if (scopeContext?.id) {
    // Context-specific check: look for a session matching the exact context entity
    switch (scopeContext.type) {
      case AuthContextTypes.CLIENT:
        session = clientSessions.value[scopeContext.id]?.token;
        break;
    }
  } else {
    // Actor-level check: look for any session of the actor type
    switch (scopeActor) {
      case ScopeActorTypes.STAFF:
        session = first(values(staffSessions.value))?.token;
        break;
      case ScopeActorTypes.CLIENT:
        session = first(values(clientSessions.value))?.token;
        break;
      case ScopeActorTypes.GUEST:
      // eslint-disable-next-line scope-based/no-self-branch, no-fallthrough -- documented exception: getSession resolves SELF to any authenticated session (code-composables.companion.md clause 4); intentional fallthrough for GUEST/SELF/default
      case ScopeActorTypes.SELF:
      default:
        // Check for ANY authenticated session (staff first, then client)
        session =
          first(values(staffSessions.value))?.token ??
          first(values(clientSessions.value))?.token;
        break;
    }
  }

  if (!session?.access_token) {
    return Promise.reject(
      new DetailedError(
        t("errors.auth.unauthorized"),
        responseCodes.Unauthorized,
        ErrorOrigin.Headless,
        { scopeActor }
      )
    );
  }

  return { session };
}

/**
 * Parse raw form data into typed model.
 * Ensures model conforms to schema structure.
 */
export async function parse(
  context: AuthContext,
  _event: AnyEventObject
): Promise<AuthModel> {
  const { model = {}, schema } = context;
  if (!schema) return model;

  return useModelParser(schema, model as Record<string, unknown>) as AuthModel;
}

/**
 * Validate model against schema.
 * Throws DetailedError with validation errors on failure.
 */
export async function validate(
  context: AuthContext,
  _event: AnyEventObject
): Promise<void> {
  const { model, schema } = context;
  if (!schema) return;

  const { validate: doValidate } = useValidation();
  const errors = doValidate(schema, model);

  if (!isEmpty(errors)) {
    throw new DetailedError(
      "Validation failed",
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      errors
    );
  }
}
// -----------------------------------------------------------------------------
// Service Factory

/**
 * Service matrix: maps scopeActor types to their service implementations.
 * Actor-specific services are created via factories, shared services are merged in.
 */
function scopedServices(scopeActor: ScopeActorTypes): AuthServices {
  switch (scopeActor) {
    case ScopeActorTypes.STAFF:
      return { parse, validate, ...createStaffAuthServices() };
    case ScopeActorTypes.GUEST:
      return { parse, validate, ...createGuestAuthServices() };
    case ScopeActorTypes.CLIENT:
    default:
      return { parse, validate, ...createClientAuthServices() };
  }
}

// -----------------------------------------------------------------------------
// Machine-Ready Services
// These wrappers accept context/event and delegate to the correct implementation

/**
 * Services object ready for direct use in XState machine.
 * Each method resolves the correct service based on context.scopeActor.
 * Uses type assertions since the machine's context model varies by state.
 */
export const authMachineServices = {
  /**
   * Check if there's already an authenticated session for the current scopeActor scope.
   */
  checkSession,

  /**
   * Parse raw form data into typed model.
   * Receives data from event, merges with existing model.
   */
  parse,
  /**
   * Validate model against schema.
   * Throws validation errors on failure.
   */
  validate,

  /**
   * Authenticate user.
   */
  authenticate: (context: AuthContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor).authenticate(
      context as AuthContext<LoginModel>,
      event
    ),
  /**
   * Verify 2FA.
   */
  verify2fa: (context: AuthContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor).verify2fa(
      context as AuthContext<TwoFAModel>,
      event
    ),

  /**
   * Register user.
   */
  register: (context: AuthContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor).register(
      context as AuthContext<RegisterModel>,
      event
    ),

  /**
   * Recover user password.
   */
  recover: (context: AuthContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor).recover(
      context as AuthContext<RecoverModel>,
      event
    ),

  /**
   * Load register lookups.
   */
  loadLookups: (context: AuthContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor).loadLookups(context, event),

  /**
   * Register a new guest-customer via the two-step GUEST_CUSTOMER grant (M5).
   * CLIENT scope only; gated by the canRegisterAsGuest machine guard (F3b).
   */
  registerAsGuest: (context: AuthContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor).registerAsGuest!(context, event)
};
