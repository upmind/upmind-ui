import { computed } from "vue";
import { AUTH_SCOPE_MATRIX } from "./auth.types";
import { useContext, useState } from "../../utils";
import { keys } from "lodash-es";
import type { ScopeActorTypes } from "../scope";
import type { AuthModel } from "./auth.types";
import type { ErrorObject, ResponseError, UseActor } from "../../utils";
import type { ScopeContext } from "../scope/scope.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module auth/useAuth.context
 * @description Auth context factory.
 * Creates actor-aware context composables based on actorScope.
 *
 * NOTE: Never access state.value.context directly - always use the useContext utility.
 */

/**
 * Creates auth context by selecting the appropriate implementation based on actorScope.
 * @internal
 */
export function createAuthContext(
  actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  // --- Shared context values (all actor scopes)
  const currentState = useState<string>(state, "value");
  const errors = useContext<ResponseError["message"]>(state, "error.message");
  const validationErrors = useContext<ErrorObject[]>(state, "error.data");
  const model = useContext<AuthModel>(state, "model");
  const schema = useContext<JsonSchema>(state, "schema");
  const session = useContext<IToken>(state, "token");
  const uischema = useContext<UISchemaElement>(state, "uischema");

  // --- Scope context values (for staff acting on behalf of client)
  const scopeContext = useContext<ScopeContext>(state, "scopeContext");
  const brandId = useContext<string>(state, "brandId");

  // --- Scope information (derived from AUTH_SCOPE_MATRIX - single source of truth)
  // Available actors for this composable (derived from matrix keys)
  const availableActors = computed(
    () => keys(AUTH_SCOPE_MATRIX) as ScopeActorTypes[]
  );

  // Current actor scope
  const scopeActor = computed(() => actorScope);

  // -----------------------------------------------------------------------------
  return {
    /** Available actor types for this composable. */
    availableActors,

    /** Brand ID filter for multi-brand environments. */
    brandId,

    /** Current state machine state value. */
    currentState,

    /** Any errors encountered during session management operations, such as login or registration failures. */
    errors,

    /** Current form model data. */
    model,

    /** JSON schema for form validation. */
    schema,

    /** Current actor scope for this instance. */
    scopeActor,

    /** Context the actor is operating upon (e.g., staff acting on client). */
    scopeContext,

    /**
     * Scope matrix defining which actors can operate on which contexts.
     * Derived from AUTH_SCOPE_MATRIX - single source of truth.
     */
    scopeMatrix: AUTH_SCOPE_MATRIX,

    /** Full session token for the current actor scope. */
    session,

    /** UI schema for form rendering. */
    uischema,

    /**
     * Validation errors encountered during session management operations, such as login or registration failures.
     * Typically contains an array of error objects with details about the validation issues.
     * @type {ErrorObject[]}
     * @see https://ajv.js.org/guide/validation-errors.html#validation-error-object
     */
    validationErrors
  };
}

// Type export for consumers
export type UseAuthContext = ReturnType<typeof createAuthContext>;
