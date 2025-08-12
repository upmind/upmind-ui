// --- internal
import { useBrand } from "../../brand";

// --- utils
import { get, map, compact, isArray, isEmpty } from "lodash-es";

// --- types
import { BrandConfigKeys, type ICompany } from "@upmind-automation/types";
import type { Company, CompanyModel } from "./types";

export function mapCompanies(raw: ICompany | ICompany[]): Company[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapCompany);
}

export function mapCompany(raw: ICompany): Company {
  const { getConfig } = useBrand();

  const hasVatValidation: boolean = get(
    getConfig(BrandConfigKeys.BASKET_VAT_VALIDATION_ENABLED),
    BrandConfigKeys.BASKET_VAT_VALIDATION_ENABLED,
    false
  );

  return {
    id: raw.id,
    emailId: raw.email_id,
    phoneId: raw.phone_id,
    addressId: raw.address_id,
    title: raw.name,
    description: compact([
      get(raw, "address.address_1"),
      get(raw, "address.address_2"),
      get(raw, "address.street"),
      get(raw, "address.city"),
      get(raw, "address.postcode"),
      get(raw, "address.region.name"),
      get(raw, "address.country.name")
    ]).join(", "),
    name: raw.name,
    default: raw.default,
    regNumber: raw.reg_number,
    vat: {
      valid: raw.vat_validated,
      number: raw.vat_number,
      percent: raw.vat_percent,
      reason: raw.vat_validation_failed_reason,
      checked: raw.vat_validation_checked_at,
      with: raw.vat_validated_with
    },
    // vat
    // ---
    meta: {
      isDefault: raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified,
      hasVat: !isEmpty(raw.vat_number),
      hasVatValidation,
      hasValidVat: !!raw.vat_validated
    }
  };
}

export function mapICompany(data: CompanyModel): ICompany {
  return {
    name: data.name ?? "",
    address_id: data.addressId,
    phone_id: data.phoneId,
    email_id: data.emailId,
    reg_number: data.regNumber ?? "",
    vat_number: data.vatNumber ?? ""
  } as ICompany;
}
