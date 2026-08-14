// -----------------------------------------------------------------------------
/**
 * @module client-address
 * @description A client's own postal addresses. This module ships TWO scoped
 * composables: the collection (`useClientAddresses`) and the per-address form
 * editor (`useClientAddressManager`).
 *
 * This barrel is the module's ONLY public surface — `client-address.services.ts`,
 * `client-address.mappers.ts` and `useClientAddressManager.machine.ts` are
 * module-private data-layer files and are never imported directly by another
 * module. Curated named re-exports only; no `export *`.
 *
 * `useClientAddressServices` is RETIRED, not deprecated (operator ruling R4):
 * its two callers now reach find-or-create through
 * `useClientAddresses().as('client').useActions().ensure`.
 *
 * `useSchemaDefinitions` / `useUischemaDefinitions` are schema FRAGMENTS — pure
 * functions of their arguments, for composing the address form into a PARENT
 * schema (`client-company`, `basket-billing/unified`). A consumer rendering the
 * address form ITSELF MUST read `useClientAddressManager().useContext().schema`
 * / `.uischema`, which are the schemas the machine actually validates against.
 * These two are not a second route to the module's data and must never acquire
 * one: no scope, no session, no request, no reactive state (`design.md` D-6).
 *
 * `mapAddress` is on the barrel because `invoices/invoices.mappers.ts` composes
 * an invoice's EMBEDDED address with it, alongside `mapClient` and
 * `mapCurrency` — the live in-tree pattern (`design.md` D-5).
 */

// --- Composables (collection + manager)
export {
  useClientAddresses,
  type UseClientAddresses
} from "./useClientAddresses";
export {
  useClientAddressManager,
  type UseClientAddressManager
} from "./useClientAddressManager";

// --- Scope matrices — one per composable, both public
export {
  CLIENT_ADDRESSES_SCOPE_MATRIX,
  ClientAddressesContextTypes,
  CLIENT_ADDRESS_SCOPE_MATRIX,
  ClientAddressContextTypes,
  AddressTypes,
  ADDRESS_TYPE_KEYS
} from "./client-address.types";
export type {
  ClientAddressesScopeMatrix,
  ClientAddressScopeMatrix
} from "./client-address.types";

// --- Public model types (shared by both composables)
export type {
  Address,
  AddressModel,
  AddressContext
} from "./client-address.types";

// --- Curated mapper export (design.md D-5 / ruling R6)
export { mapAddress } from "./client-address.mappers";

// --- Schema-FRAGMENT surface (design.md D-6 / ruling R7) — the ONE deviation
// from the reference conversion's "no schema exports" law. The PARSERS
// (useSchema / useUischema) stay internal; consumers reach them through
// useClientAddressManager().useContext().schema / .uischema.
export {
  useSchemaDefinitions,
  useUischemaDefinitions
} from "./client-address.schemas";

// --- Sub-composable type exports for consumers (collection)
export type { UseClientAddressesActions } from "./useClientAddresses.actions";
export type { UseClientAddressesContext } from "./useClientAddresses.context";
export type { UseClientAddressesMeta } from "./useClientAddresses.meta";
export type { UseClientAddressesInternals } from "./useClientAddresses.internals";

// --- Sub-composable type exports for consumers (manager)
export type { UseClientAddressManagerActions } from "./useClientAddressManager.actions";
export type { UseClientAddressManagerContext } from "./useClientAddressManager.context";
export type { UseClientAddressManagerMeta } from "./useClientAddressManager.meta";
export type { UseClientAddressManagerInternals } from "./useClientAddressManager.internals";
