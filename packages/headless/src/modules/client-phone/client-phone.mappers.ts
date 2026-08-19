/** @internal */
import parsePhoneNumber, { type CountryCode } from "libphonenumber-js";
import { map, get, compact, isArray } from "lodash-es";
import type { Phone, PhoneModel } from "./client-phone.types";
import type { IPhone } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-phone/client-phone.mappers
 * @description Wire ↔ view-model shaping for client phones. Pure — no side
 * effects, no HTTP, and never actor-scoped: a divergent response shape would
 * be expressed as an actor-named mapper chosen at a services arm's own
 * `select:` call site, not by scoping this file.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientPhones.ts` / `useClientPhoneManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */

/** Maps the list response to the view-model collection. */
export function mapPhones(raw: IPhone | IPhone[]): Phone[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapPhone);
}

/** Maps one wire record to the view-model. */
export function mapPhone(raw: IPhone): Phone {
  const phone = parsePhoneNumber(
    raw.phone ?? "",
    raw.phone_country_code as CountryCode
  );

  return {
    id: raw.id,
    title: get(raw, "international_phone"),
    description: compact([get(raw, "phone_country_code")]).join(" | "),
    phone: {
      number: phone?.number ?? null,
      country: phone?.country ?? null,
      nationalNumber: phone?.nationalNumber ?? null,
      countryCallingCode: phone?.countryCallingCode ?? null
    },
    type: raw.type,
    meta: {
      isDefault: !!raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified
    }
  };
}

/**
 * Maps the form model to the outbound request body.
 *
 * `type` is omitted deliberately (decision D-1, row W4) — the form has no
 * control for it and every live consumer creates/updates phones with no
 * `type`; adding one would fail every one of those saves on day one.
 */
export function mapIPhone(data: PhoneModel): IPhone {
  return {
    phone: data.phone.nationalNumber ?? "", // without the country code
    phone_code: data.phone.countryCallingCode
      ? `+${data.phone.countryCallingCode}`
      : "",
    phone_country_code: data.phone.country ?? ""
  } as IPhone;
}
