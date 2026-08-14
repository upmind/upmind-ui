// -----------------------------------------------------------------------------
/**
 * @module client-company
 * @description A client's own companies. This module ships TWO scoped
 * composables: the collection (`useClientCompanies`) and the per-company form
 * editor (`useClientCompanyManager`).
 *
 * This barrel is the module's ONLY public surface — `client-company.services.ts`
 * and `client-company.mappers.ts` are module-private data-layer files and are
 * never imported directly by another module. Curated named re-exports only;
 * no `export *`.
 *
 * `useCompanySchema` / `useCompanyUischema` are schema FRAGMENTS — pure
 * functions of their arguments, for composing the company form into a PARENT
 * schema (`basket-billing/unified`). A consumer rendering the company form
 * ITSELF MUST read `useClientCompanyManager().useContext().schema` /
 * `.uischema`, which are the schemas the machine actually validates against.
 * These two are not a second route to the module's data and must never
 * acquire one: no scope, no session, no request, no reactive state
 * (`design.md` D5).
 */

// --- Composables (collection + manager)
export {
  useClientCompanies,
  type UseClientCompanies
} from "./useClientCompanies";
export {
  useClientCompanyManager,
  type UseClientCompanyManager,
  type UseClientCompany
} from "./useClientCompanyManager";

// --- Scope matrices — one per composable, both public
export {
  CLIENT_COMPANIES_SCOPE_MATRIX,
  ClientCompaniesContextTypes,
  CLIENT_COMPANY_SCOPE_MATRIX,
  ClientCompanyContextTypes
} from "./client-company.types";
export type {
  ClientCompaniesScopeMatrix,
  ClientCompanyScopeMatrix
} from "./client-company.types";

// --- Public model types (shared by both composables)
export type {
  Company,
  CompanyModel,
  CompanyContext
} from "./client-company.types";

// --- Schema-fragment surface (design.md D5 — the ONE deviation from the
// reference conversion's "no schema exports" law)
export {
  useSchema as useCompanySchema,
  useUischema as useCompanyUischema
} from "./client-company.schemas";

// --- Sub-composable type exports for consumers (collection)
export type { UseClientCompaniesActions } from "./useClientCompanies.actions";
export type { UseClientCompaniesContext } from "./useClientCompanies.context";
export type { UseClientCompaniesMeta } from "./useClientCompanies.meta";
export type { UseClientCompaniesInternals } from "./useClientCompanies.internals";

// --- Sub-composable type exports for consumers (manager)
export type { UseClientCompanyManagerActions } from "./useClientCompanyManager.actions";
export type { UseClientCompanyManagerContext } from "./useClientCompanyManager.context";
export type { UseClientCompanyManagerMeta } from "./useClientCompanyManager.meta";
export type { UseClientCompanyManagerInternals } from "./useClientCompanyManager.internals";
