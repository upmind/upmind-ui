/** @internal */
import type { Currency } from "./currency.types";
import type { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export function mapCurrency(raw: ICurrency): Currency {
  return {
    base: raw.base,
    code: raw.code,
    createdAt: raw.created_at,
    decimals: raw.decimals,
    id: raw.id,
    manual: raw.manual,
    name: raw.name,
    prefix: raw.prefix,
    suffix: raw.suffix,
    updatedAt: raw.updated_at
  };
}

export function mapICurrency(currency: Currency): ICurrency {
  return {
    base: currency.base,
    code: currency.code,
    created_at: currency.createdAt,
    decimals: currency.decimals,
    id: currency.id,
    manual: currency.manual,
    name: currency.name,
    prefix: currency.prefix,
    suffix: currency.suffix,
    updated_at: currency.updatedAt
  };
}
