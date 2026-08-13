// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Four-Layer Return Shape"
 * (Context row) + `code-xstate.md` (canonical state-read APIs: never touch
 * `state.value.context` directly). A disagreement between this skeleton, its
 * worked example, and the doctrine is a surfaced finding, never silently
 * resolved toward either.
 *
 * `@precedent` the recovered `client-email/useClientEmailManager.context.ts`.
 */

import { useContext } from "../../utils";
import type { ModuleContext, ModuleModel } from "./module.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module module/useModuleManager.context
 * @description Manager context factory — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility;
 * `state.value.context` is never read directly (`code-xstate.md`).
 *
 * THIS is where a hybrid module's schema and uischema surface. They enter the
 * system in `useModuleManager.machine.ts`'s `setSchemas` action, live in
 * machine context, and reach consumers HERE — `index.ts` exports no bare
 * `useSchema`/`useUischema`, because a form rendered from a schema the machine
 * has not adopted validates against a different contract than the one that
 * saves.
 *
 * ERRORS ARE STATE, NOT EVENTS. `errors` and `validationErrors` are the
 * machine's captured failure, exposed for the consumer to render. The headless
 * layer never fires them (no `useFeedback`, no toast, anywhere in this module).
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createModuleManagerContext(
  actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  // --- actor-specific context: none earned yet (clause 2). When a scope earns
  // one, add `useModuleManager.context.{actor}.ts` following the collection
  // half's arm template and spread it LAST.

  return {
    /** The full data-manager context object. */
    context: useContext<ModuleContext>(state),

    /** Description of the item being managed. */
    description: useContext<string | undefined>(state, "description"),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The id of the item being managed (undefined for a new item). */
    id: useContext<string | undefined>(state, "id"),

    /** Reference data the machine's `loadLookups` service resolved. */
    lookups: useContext<ModuleContext["lookups"]>(state, "lookups"),

    /** The current form model. */
    model: useContext<ModuleModel | undefined>(state, "model"),

    /** The JSON schema for the form (from machine context — see JSDoc). */
    schema: useContext<ModuleContext["schema"]>(state, "schema"),

    /** Display title of the item. */
    title: useContext<string | undefined>(state, "title"),

    /** The UI schema for the form (from machine context — see JSDoc). */
    uischema: useContext<ModuleContext["uischema"]>(state, "uischema"),

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseModuleManagerContext = ReturnType<
  typeof createModuleManagerContext
>;
