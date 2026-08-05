import { useContext } from "../../utils";
import type { EmailContext, EmailModel } from "./client-email.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager.context
 * @description Manager context — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility;
 * `state.value.context` is never read directly.
 *
 * THIS is where the schema and uischema surface. They enter the system in
 * `useClientEmailManager.machine.ts`'s `setSchemas`, live in machine context,
 * and reach consumers HERE — the barrel exports no bare pair, because a form
 * rendered from a schema the machine has not adopted validates against a
 * different contract than the one that saves.
 *
 * ERRORS ARE STATE, NOT EVENTS. `errors` and `validationErrors` are the
 * machine's captured failure, exposed for the consumer to render.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientEmailManagerContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  // --- actor-specific context: none earned yet (clause 2). When a scope earns
  // one, add `useClientEmailManager.context.{actor}.ts` and spread it LAST.

  return {
    /** The full data-manager context object. */
    context: useContext<EmailContext>(state),

    /** Description of the email being managed. */
    description: useContext<string | undefined>(state, "description"),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The id of the email being managed (undefined for a new address). */
    id: useContext<string | undefined>(state, "id"),

    /** The current form model. */
    model: useContext<EmailModel | undefined>(state, "model"),

    /** The JSON schema for the form (from machine context — see JSDoc). */
    schema: useContext<EmailContext["schema"]>(state, "schema"),

    /** Display title of the email. */
    title: useContext<string | undefined>(state, "title"),

    /** The UI schema for the form (from machine context — see JSDoc). */
    uischema: useContext<EmailContext["uischema"]>(state, "uischema"),

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientEmailManagerContext = ReturnType<
  typeof createClientEmailManagerContext
>;
