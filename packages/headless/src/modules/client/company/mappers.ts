// --- utils
import { compact, get, isArray, map } from "lodash-es";

// --- types
import type { Company, CompanyWithRelations } from "./types";

export const mapCompany = (
  raw: CompanyWithRelations | CompanyWithRelations[]
): Company[] => {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, rawItem => {
    return {
      id: rawItem.id,
      emailId: rawItem.email_id,
      phoneId: rawItem.phone_id,
      addressId: rawItem.address_id,
      title: rawItem.name,
      description: compact([
        get(rawItem, "address.address1"),
        get(rawItem, "address.address2"),
        get(rawItem, "address.street"),
        get(rawItem, "address.city"),
        get(rawItem, "address.postcode"),
        get(rawItem, "address.region.name"),
        get(rawItem, "address.country.name"),
      ]).join(", "),
      name: rawItem.name,
      default: rawItem.default,
      regNumber: rawItem.reg_number,
      vatNumber: rawItem.vat_percent,
      vatPercent: rawItem.vat_percent,
    };
  });
};
