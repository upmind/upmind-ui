// --- utils
import { get, map, compact, isArray } from "lodash-es";

// --- types
import type { ICompany } from "@upmind-automation/types";
import type { Company, CompanyModel } from "./types";

export function mapCompanies(raw: ICompany | ICompany[]): Company[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapCompany);
}

export function mapCompany(raw: ICompany): Company {
  return {
    id: raw.id,
    emailId: raw.email_id,
    phoneId: raw.phone_id,
    addressId: raw.address_id,
    title: raw.name,
    description: compact([
      get(raw, "address.address1"),
      get(raw, "address.address2"),
      get(raw, "address.street"),
      get(raw, "address.city"),
      get(raw, "address.postcode"),
      get(raw, "address.region.name"),
      get(raw, "address.country.name"),
    ]).join(", "),
    name: raw.name,
    default: raw.default,
    regNumber: raw.reg_number,
    vatNumber: raw.vat_percent,
    vatPercent: raw.vat_percent,
    // ---
    meta: {
      isDefault: raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified,
    },
  };
}

export function mapICompany(data: CompanyModel): ICompany {
  return {
    name: data.name,
    address_id: data.addressId,
    phone_id: data.phoneId,
    email_id: data.emailId,
    reg_number: data.regNumber,
    vat_number: data.vatNumber,
  } as ICompany;
}
