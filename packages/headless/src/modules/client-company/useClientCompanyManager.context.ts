import { useContext } from "../../utils";
import type { CompanyContext, CompanyModel } from "./client-company.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module client-company/useClientCompanyManager.context
 * @description Manager context — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility;
 * `state.value.context` is never read directly.
 *
 * THIS is where the schema and uischema surface. They enter the system in
 * `useClientCompanyManager.machine.ts`'s `setSchemas`, live in machine
 * context, and reach consumers HERE — the barrel exports the module's OWN
 * `useCompanySchema` / `useCompanyUischema` only as a separate, PURE
 * fragment surface (`design.md` D5); a consumer rendering the company form
 * ITSELF reads them here, off the schema the machine actually validates
 * against.
 *
 * ERRORS ARE STATE, NOT EVENTS. `errors` and `validationErrors` are the
 * machine's captured failure, exposed for the consumer to render.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientCompanyManagerContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useClientCompanyManager.context.{actor}.ts` and spread it
  // LAST.

  return {
    /** The client's own addresses, loaded by `loadLookups` (AC-16). */
    addresses: useContext<CompanyContext["addresses"]>(state, "addresses"),

    /** The dependency-resolved starting model `loadLookups` seeds (AC-16). */
    baseModel: useContext<CompanyContext["baseModel"]>(state, "baseModel"),

    /** The brand config keys `loadLookups` fetched (AC-16). */
    config: useContext<CompanyContext["config"]>(state, "config"),

    /** All available countries (AC-16). */
    countries: useContext<CompanyContext["countries"]>(state, "countries"),

    /** The full data-manager context object. */
    context: useContext<CompanyContext>(state),

    /** Description of the company being managed. */
    description: useContext<string | undefined>(state, "description"),

    /** The client's own emails, loaded by `loadLookups` (AC-16). */
    emails: useContext<CompanyContext["emails"]>(state, "emails"),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The id of the company being managed (undefined for a new company). */
    id: useContext<string | undefined>(state, "id"),

    /** The current form model. */
    model: useContext<CompanyModel | undefined>(state, "model"),

    /** The client's own phones, loaded by `loadLookups` (AC-16). */
    phones: useContext<CompanyContext["phones"]>(state, "phones"),

    /** The regions available for the selected country (AC-17). */
    regions: useContext<CompanyContext["regions"]>(state, "regions"),

    /** The JSON schema for the form (from machine context — see JSDoc). */
    schema: useContext<CompanyContext["schema"]>(state, "schema"),

    /** Display title of the company. */
    title: useContext<string | undefined>(state, "title"),

    /** The UI schema for the form (from machine context — see JSDoc). */
    uischema: useContext<CompanyContext["uischema"]>(state, "uischema"),

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientCompanyManagerContext = ReturnType<
  typeof createClientCompanyManagerContext
>;
