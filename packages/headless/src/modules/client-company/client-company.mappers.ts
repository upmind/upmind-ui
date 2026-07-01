/** @internal */
import { BrandConfigKeys, type ICompany } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useRelativeTime } from "../../utils";
import { get, map, compact, isArray, isEmpty } from "lodash-es";
import type { Company, CompanyModel } from "./client-company.types";

// -----------------------------------------------------------------------------

export function mapCompanies(raw: ICompany | ICompany[]): Company[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapCompany);
}

export function mapCompany(raw: ICompany): Company {
  const { getConfig } = useBrand();

  const hasTaxValidation: boolean = get(
    getConfig(BrandConfigKeys.TAX_NUMBER_VALIDATION_ENABLED),
    BrandConfigKeys.TAX_NUMBER_VALIDATION_ENABLED,
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
    tax: {
      number: raw.vat_number,
      valid: raw.vat_validated,
      percent: raw.vat_percent,
      reason: raw.vat_validation_failed_reason,
      checked: {
        date: raw.vat_validation_checked_at,
        relative: useRelativeTime(raw.vat_validation_checked_at ?? "")
      },
      with: raw.vat_validated_with
    },
    // ---
    meta: {
      isDefault: raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified,
      hasTax: !isEmpty(raw.vat_number),
      hasTaxValidation,
      hasValidTax: !!raw.vat_validated
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
    vat_number: data.tax?.number ?? ""
  } as ICompany;
}
