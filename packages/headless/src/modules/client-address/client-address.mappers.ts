/** @internal */
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-address/client-address.mappers
 * @description Pure shape mappers between the API's `IAddress` and this
 * module's `Address` / `AddressModel`. No scope, no session, no request, no
 * reactive state.
 *
 * `mapAddress` is the ONE member this module publishes on its barrel
 * (`design.md` D-5 / ruling R6) — `invoices/invoices.mappers.ts` composes an
 * invoice's EMBEDDED address with it, alongside `mapClient` and `mapCurrency`.
 * Everything else here is module-private.
 */
import { ADDRESS_TYPE_KEYS } from "./client-address.types";
import { get, map, isArray, isEqual, compact, omitBy } from "lodash-es";
import type { Address, AddressModel } from "./client-address.types";
import type { IAddress } from "@upmind-automation/types";

// ---
export function mapAddresses(raw: IAddress | IAddress[]): Address[] {
  // we could get a plain address OR a company with and address
  // so we normalize the data to always be an array of addresses
  // this is to allow for a 'unified' way of handling addresses
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapAddress);
}

export function mapAddress(raw: IAddress): Address {
  return {
    id: raw.id,
    clientId: raw.client_id,
    // ---
    title: raw.address_1 || "New Address",
    countryName: get(raw, "country.name"),
    // The field set AND the order are the parity claim (`parity.yaml` L2,
    // AC-31): legacy composes address_1, address_2, city, state, postcode,
    // region.name, country.name (`UAddress.vue:88-98`). The pre-conversion
    // join opened on `address_2`, read a `street` field that does not exist on
    // `IAddress` at all, and dropped `state`. The separator stays the headless
    // ", " — legacy's ",\n" is presentation of the legacy card and is
    // explicitly not claimed.
    description: compact([
      get(raw, "address_1"),
      get(raw, "address_2"),
      get(raw, "city"),
      get(raw, "state"),
      get(raw, "postcode"),
      get(raw, "region.name"),
      get(raw, "country.name")
    ]).join(", "),
    regionName: get(raw, "region.name"),
    // ---
    name: raw.name,
    address: {
      address1: raw.address_1,
      address2: raw.address_2,
      city: raw.city,
      state: raw.state,
      postcode: raw.postcode,
      regionId: raw.region_id,
      countryId: raw.country_id
    },
    type: raw.type,
    verifiedLevel: raw.verified,
    // ---
    meta: {
      isDefault: raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified
    }
  };
}

/**
 * The wire payload for a CREATE, and the full-payload fallback for an edit with
 * no baseline to diff against.
 *
 * `type` carries the client's CHOICE (`parity.yaml` L5 / AC-22), which is why
 * it is read off the model rather than hardcoded. The `?? HOME` is for the
 * SCHEMA-LESS callers: the manager's model always carries a type because the
 * schema supplies `default: baseModel?.type ?? HOME`, but `client-company` and
 * `basket-billing/unified` hand-build `{ address } as AddressModel` literals
 * with no type at all — `undefined` there is stripped by `JSON.stringify` and
 * the wire loses a field it has always carried.
 *
 * `region_id` is coerced for the same reason its six `address` siblings are:
 * NOTHING may leave this function `undefined`. `parse` clears a region that the
 * newly selected country does not carry (AC-19) by assigning `undefined`;
 * `mapIAddressDataDiff` then correctly KEEPS the key, because the field really
 * did change — and `parseData`'s `JSON.stringify` drops it again on the way
 * out, so a US → UK change PUT `country_id` with no `region_id` and the server
 * kept the stale US region on a UK address. An explicit `null` survives
 * serialisation and clears the column.
 *
 * Coercing HERE rather than at `parse` is deliberate: both sides of the diff
 * run through this function, so an address that never had a region maps `null`
 * on both and is correctly OMITTED, and no `null` ever enters the model — where
 * the region control's `enum` (real region ids only) would reject it and wedge
 * the machine in `available.invalid`. `country_id` stays uncoerced: it is
 * schema-required and is never intentionally cleared, so a `null` there would
 * be an invalid payload rather than a clearance.
 */
export function mapIAddressData(data: AddressModel | Address): IAddress {
  return {
    name: data.name || data.address.address1 || "",
    address_1: data.address.address1 ?? "",
    address_2: data.address.address2 ?? "",
    city: data.address.city ?? "",
    state: data.address.state ?? "",
    postcode: data.address.postcode ?? "",
    region_id: data.address.regionId ?? null,
    country_id: data.address.countryId,
    type: data.type ?? ADDRESS_TYPE_KEYS.HOME
  } as IAddress;
}

/**
 * The wire payload for an EDIT: only the fields that changed since the form
 * opened. Legacy computes exactly this — `omitBy(form, (v, k) =>
 * formClone[k] === v)` against a clone taken at open
 * (`addEditClientAddressModal.vue:220-224`, `parity.yaml` L3 / AC-23).
 *
 * The diff is taken at the WIRE shape, not the model shape, because that is
 * where legacy takes it and because `AddressModel.address` is nested — a
 * model-level diff would send the whole `address` object the moment one of its
 * seven fields moved. Not cosmetic: under `CLIENT_ALLOW_ADDRESS_UPDATE ===
 * false` a full payload re-sends an unchanged `country_id` and the API rejects
 * an edit legacy would have accepted.
 */
export function mapIAddressDataDiff(
  data: AddressModel | Address,
  baseData?: AddressModel | Address
): Partial<IAddress> {
  const next = mapIAddressData(data);
  if (!baseData) return next;

  const previous = mapIAddressData(baseData);

  return omitBy(next, (value, key) =>
    isEqual(previous[key as keyof IAddress], value)
  ) as Partial<IAddress>;
}
