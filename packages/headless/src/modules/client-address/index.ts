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

/**
 * @decision D-5 / ruling R6 — `mapAddress` stays on the barrel.
 *
 * what: `client-address.mappers.ts` takes the line-1 `@internal` marker;
 *   this barrel keeps ONE curated named export, `mapAddress`. `invoices/` is
 *   not edited.
 * why: cross-module mapper exports are the live in-tree pattern —
 *   `currency/index.ts:2`, `client-custom-fields/index.ts:3`,
 *   `invoices/index.ts:3`, and `client/index.ts` re-exports `mapClient`.
 *   Decisively, `invoices/invoices.mappers.ts:5` imports `mapAddress` from
 *   this barrel alongside `mapClient` and `mapCurrency`; singling out one of
 *   three would invent a rule the repo does not have.
 * rejected: (a) a new `@public @model-mapper` carve-out class — invents a
 *   second convention for a case the repo already covers; (b) a `@deprecated`
 *   re-export — "deprecated" implies a sunset path and there is none, since an
 *   invoice's EMBEDDED address is never fetched by this module and has no
 *   composable seam to route through; (c) duplicating the transform into
 *   `invoices` — two divergent copies of the address shape.
 * note: the reference conversion exports no mapper because nothing outside
 *   consumed one. That is an absence of need, not a prohibition; reading it as
 *   a ban was the prior run's error (closed by PR-5, re-affirmed by R6).
 */
export { mapAddress } from "./client-address.mappers";

/**
 * @decision D-6 / ruling R7 — the schema FRAGMENTS stay on the barrel. The ONE
 * deviation from the reference conversion's "no schema exports" law.
 *
 * what: `client-address.schemas.ts` swaps its line-1 `@internal` for
 *   `@public @schema-fragment`, and this barrel exports
 *   `useSchemaDefinitions` / `useUischemaDefinitions`. The PARSERS
 *   `useSchema` / `useUischema` stay module-private and reach consumers only
 *   through `useClientAddressManager().useContext().schema` / `.uischema`.
 * why: four cross-module call sites compose the address DEFINITIONS into a
 *   larger schema at module scope, where no `useClientAddressManager`
 *   instance exists to read from machine context — `client-company.schemas.ts`
 *   (2 sites) and `basket-billing/unified/schemas.ts` (3 sites). The barrel's
 *   usual "schema reaches consumers via `useContext()`" route does not fit
 *   them.
 * rejected: following the reference conversion's "NO SCHEMA EXPORTS HERE". It
 *   forces both consumers onto deep-path imports with an `eslint-disable` —
 *   a hazard already live in this tree for `client-phone`
 *   (`basket-billing/unified/schemas.ts` carries exactly that comment and
 *   disable). Reproducing it for a second module would be adopting a
 *   workaround as a convention.
 * precedent: `client-company` established and merged this shape. Divergence is
 *   explicit and authorised, and is NOT a precedent for a module without such
 *   a consumer.
 *
 * The same block sits on `client-address.schemas.ts`'s own header, adjacent to
 * the `@public @schema-fragment` marker it authorises.
 */
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
