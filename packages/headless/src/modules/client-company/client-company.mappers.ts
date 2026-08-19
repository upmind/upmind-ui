/** @internal */
import { BrandConfigKeys, type ICompany } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useRelativeTime } from "../../utils";
import { get, map, compact, isArray, isEmpty, orderBy } from "lodash-es";
import type { Company, CompanyModel } from "./client-company.types";
// -----------------------------------------------------------------------------
/**
 * @module client-company/client-company.mappers
 * @description Wire <-> view-model shaping for client companies. Pure — no
 * side effects, no HTTP, and never actor-scoped: a divergent response shape
 * would be expressed as an actor-named mapper chosen at a services arm's own
 * `select:` call site, not by scoping this file.
 *
 * `mapCompany` reads the brand's tax-validation config synchronously; the
 * config is FETCHED by the caller (`client-company.services.ts`'s `loadList`
 * guard) before this mapper ever runs, which is what makes
 * `meta.hasTaxValidation` reliable on a cold boot (`parity.yaml` C7).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientCompanies.ts` / `useClientCompanyManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */

/**
 * Maps the list response to the view-model collection, ascending by
 * `created_at` (AC-8) — a client-side guarantee, not merely the outbound
 * `sort` param's request: "not in whatever order the server happened to
 * return" (requirements.md AC-8).
 */
export function mapCompanies(raw: ICompany | ICompany[]): Company[] {
  const rows = orderBy(isArray(raw) ? raw : [raw], "created_at", "asc");
  return map(rows, mapCompany);
}

/** Maps one wire record to the view-model. */
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
    meta: {
      isDefault: !!raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified,
      hasTax: !isEmpty(raw.vat_number),
      hasTaxValidation,
      hasValidTax: !!raw.vat_validated
    }
  };
}

/**
 * Maps a form model to the outbound request body — ONLY the keys actually
 * present on `data` as own properties. `add` is handed the full, dependency-
 * resolved model (every key present); `update` is handed a DIFF (only the
 * changed keys), computed by `diffCompanyModel` — this is what makes an edit
 * of one field rewrite only that field (`parity.yaml` C24, in-cell gap G3).
 *
 * `default` is deliberately never mapped — the legacy edit modal has no
 * `default` field either, and `setDefault` is the only route (C14).
 */
export function mapICompany(data: Partial<CompanyModel>): Partial<ICompany> {
  const payload: Partial<ICompany> = {};

  if ("name" in data) payload.name = data.name ?? "";
  if ("addressId" in data) payload.address_id = data.addressId;
  if ("phoneId" in data) payload.phone_id = data.phoneId;
  if ("emailId" in data) payload.email_id = data.emailId;
  if ("regNumber" in data) payload.reg_number = data.regNumber ?? "";
  if ("tax" in data) payload.vat_number = data.tax?.number ?? "";

  return payload;
}
