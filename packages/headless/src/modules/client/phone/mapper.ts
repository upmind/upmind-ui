// --- external
import parsePhoneNumber, { CountryCode } from "libphonenumber-js";

// --- utils
import { map, get, compact, isArray, isNil, omitBy } from "lodash-es";

// --- types
import type { IPhone } from "@upmind-automation/types";
import type { Phone, PhoneModel } from "./types";

export function mapPhones(raw: IPhone | IPhone[]): Phone[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapPhone);
}

export function mapPhone(raw: IPhone): Phone {
  const phone = parsePhoneNumber(
    raw.phone || "",
    raw.phone_country_code as CountryCode
  );

  return {
    id: raw.id,
    title: get(raw, "international_phone"),
    description: compact([get(raw, "phone_country_code")]).join(" | "),
    phone: {
      number: phone?.number ?? "",
      country: phone?.country ?? "",
      nationalNumber: phone?.nationalNumber ?? "",
      countryCallingCode: phone?.countryCallingCode ?? ""
    },
    type: raw.type,
    // ---
    meta: {
      isDefault: !!raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified
    }
  };
}

export function mapIPhone(data: PhoneModel): IPhone {
  return omitBy(
    {
      phone: data.phone.nationalNumber, // without the country code
      phone_code: `+${data.phone.countryCallingCode}`,
      phone_country_code: data.phone.country
    } as IPhone,
    isNil
  ) as IPhone;
}
