/** @internal */
import parsePhoneNumber, { type CountryCode } from "libphonenumber-js";
import { map, get, compact, isArray } from "lodash-es";
import type { Phone, PhoneModel } from "./client-phone-dry.types";
import type { IPhone } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/mappers
 * @description Wire <-> view-model shaping only, shared by both cells — no
 * per-actor mapper split (`templates/ARMS.md` "Which files can earn an arm";
 * the per-actor divergence for this module is the endpoint the services arm
 * calls, not the shape of what it maps).
 */

export function mapPhones(raw: IPhone | IPhone[]): Phone[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapPhone);
}

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
      isVerified: !!raw.verified,
      // D4 — staged rows are read-only parity; no authoring in scope.
      isStaged: !!raw.staged_import
    }
  };
}

/** D2 — `type` is carried in the write body (un-drop of baseline `mapper.ts:37-45`). */
export function mapIPhone(data: PhoneModel): IPhone {
  return {
    phone: data.phone.nationalNumber ?? "",
    phone_code: data.phone.countryCallingCode
      ? `+${data.phone.countryCallingCode}`
      : "",
    phone_country_code: data.phone.country ?? "",
    type: data.type
  } as IPhone;
}
