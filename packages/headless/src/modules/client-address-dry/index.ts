/**
 * @module client-address-dry
 * @description `client-address-dry` — query-variant scoped module for client
 * postal addresses, side-by-side with `client-address/`
 * (`docs/sdd/client-address-dry-smoke/design.md`). This barrel is the
 * module's ONLY public surface — every other file carries its own
 * `@internal` marker and is never imported directly by another module.
 */

export {
  useClientAddressesDry,
  type UseClientAddressesDry
} from "./useClientAddressesDry";

// --- Scope matrix
export {
  CLIENT_ADDRESS_DRY_SCOPE_MATRIX,
  AddressContextTypes
} from "./client-address-dry.types";
export type { ClientAddressDryScopeMatrix } from "./client-address-dry.types";

// --- Sub-composable type exports for consumers
export type { UseClientAddressesDryActions } from "./useClientAddressesDry.actions";
export type { UseClientAddressesDryContext } from "./useClientAddressesDry.context";
export type { UseClientAddressesDryMeta } from "./useClientAddressesDry.meta";
export type { UseClientAddressesDryInternals } from "./useClientAddressesDry.internals";

// --- Public item/model types
export type { Address, AddressModel } from "./client-address-dry.types";
export { AddressTypes } from "./client-address-dry.types";

// --- Form schema (mirrors `client-address/index.ts:6-7` and `client-phone-dry/index.ts:32-35`)
export {
  useSchema as useAddressSchema,
  useUischema as useAddressUischema
} from "./client-address-dry.schemas";
