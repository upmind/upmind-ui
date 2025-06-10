// --- external
import parsePhoneNumber, { CountryCode } from "libphonenumber-js";

// --- utils
import { map, get, compact, isArray } from "lodash-es";

// --- types
import { PhoneTypes } from "./types";
import type { IPhone } from "@upmind-automation/types";
import type { Phone, PhoneModel } from "./types";

export function mapPhones(raw: IPhone | IPhone[]): Phone[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapPhone);
}

export function mapPhone(raw: IPhone): Phone {
  let rawType = get(raw, "type");
  const type = rawType ? get(PhoneTypes, rawType) : undefined;

  const phone = parsePhoneNumber(
    raw.phone || "",
    raw.phone_country_code as CountryCode
  );

  return {
    id: raw.id,
    title: get(raw, "international_phone"),
    description: compact([get(raw, "phone_country_code"), type?.value]).join(
      " | "
    ),
    phone: {
      number: phone?.number ?? "",
      country: phone?.country ?? "",
      nationalNumber: phone?.nationalNumber ?? "",
      countryCallingCode: phone?.countryCallingCode ?? "",
    },
    type: raw.type,
    // ---
    meta: {
      isDefault: !!raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified,
    },
  };
}

export function mapIPhone(data: PhoneModel): IPhone {
  return {
    type: data.type,
    phone: data.phone.nationalNumber, // without the country code
    phone_code: `+${data.phone.countryCallingCode}`,
    phone_country_code: data.phone.country,
  } as IPhone;
}
