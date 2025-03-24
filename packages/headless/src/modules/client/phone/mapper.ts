// --- utils
import { map, get, compact, isArray } from "lodash-es";

// --- types
import { PhoneTypes } from "./types";
import type { Phone } from "./types";
import type { IPhone } from "@upmind-automation/types";

export const mapPhone = (raw: IPhone | IPhone[]): Phone[] => {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, rawItem => {
    let rawType = get(rawItem, "type");
    const type = rawType ? get(PhoneTypes, rawType) : undefined;

    return {
      id: rawItem.id,
      type: rawItem.type,
      default: rawItem.default,
      country: rawItem.phone_country_code,
      nationalNumber: rawItem.phone,
      countryCallingCode: rawItem.phone_code,
      title: get(rawItem, "international_phone"),
      description: compact([get(rawItem, "phone_country_code"), type]).join(
        " | "
      ),
    };
  });
};
