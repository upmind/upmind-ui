import { useContext } from "../../utils";
import type { AddressContext, AddressModel } from "./client-address.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddressManager.context
 * @description Manager context — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility;
 * `state.value.context` is never read directly.
 *
 * THIS is where the schema and uischema surface. They enter the system in
 * `useClientAddressManager.machine.ts`'s `setSchemas`, live in machine
 * context, and reach consumers HERE — the barrel's `useSchemaDefinitions` /
 * `useUischemaDefinitions` are a separate, PURE FRAGMENT surface for composing
 * the address form into a PARENT schema (`design.md` D-6); a consumer
 * rendering the address form ITSELF reads them here, off the schema the
 * machine actually validates against.
 *
 * ERRORS ARE STATE, NOT EVENTS. `errors` and `validationErrors` are the
 * machine's captured failure, exposed for the consumer to render.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientAddressManagerContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  // --- actor-specific context: none earned yet (clause 2). When a scope earns
  // one, add `useClientAddressManager.context.{actor}.ts` and spread it LAST.

  return {
    /** The dependency-resolved starting model `loadLookups` seeds (AC-16). */
    baseModel: useContext<AddressContext["baseModel"]>(state, "baseModel"),

    /** The brand config keys `loadLookups` fetched (AC-20, AC-21). */
    config: useContext<AddressContext["config"]>(state, "config"),

    /** The full data-manager context object. */
    context: useContext<AddressContext>(state),

    /** The country resolved from the model's `countryId` (AC-19). */
    country: useContext<AddressContext["country"]>(state, "country"),

    /** All available countries (AC-18). */
    countries: useContext<AddressContext["countries"]>(state, "countries"),

    /** Description of the address being managed. */
    description: useContext<string | undefined>(state, "description"),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The id of the address being managed (undefined for a new address). */
    id: useContext<string | undefined>(state, "id"),

    /** The current form model. */
    model: useContext<AddressModel | undefined>(state, "model"),

    /** The regions available for the selected country (AC-18, AC-19). */
    regions: useContext<AddressContext["regions"]>(state, "regions"),

    /** The JSON schema for the form (from machine context — see JSDoc). */
    schema: useContext<AddressContext["schema"]>(state, "schema"),

    /** Display title of the address. */
    title: useContext<string | undefined>(state, "title"),

    /** The UI schema for the form (from machine context — see JSDoc). */
    uischema: useContext<AddressContext["uischema"]>(state, "uischema"),

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientAddressManagerContext = ReturnType<
  typeof createClientAddressManagerContext
>;
