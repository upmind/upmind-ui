import {
  BrandConfigKeys,
  BasketCurrencySource
} from "@upmind-automation/types";
import { useSessionStorage } from "../../utils/useStorage";
import { useBrand } from "../brand";
import { useActiveSession } from "../session-store";
import {
  SupportedLocaleCodes,
  WIPLocaleCodes
} from "../system-localisation/system-localisation.locales";
import { compact, find, first, intersection, map } from "lodash-es";
import type { CurrencyContext, CurrencyModel } from "./basket-currency.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type {
  ICurrency,
  ISO_4217_CURRENCY_CODE
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const CURRENCY_STORAGE_KEY = "currency";
export const CURRENCY_DEFAULT_STORAGE_KEY = "currency_default";

export const useSchema = ({ currencies, baseModel }: CurrencyContext) => {
  const schema = {
    type: "object",
    title: "Currency",
    required: ["code"],
    properties: {
      code: {
        type: ["string", "null"],
        default: baseModel?.code,
        oneOf: map(currencies, item => ({
          const: item.code,
          title: `${item?.prefix || item?.suffix} ${item.code}`
        }))
      }
    }
  };

  return schema as JsonSchema;
};

export const useUischema = (_context: CurrencyContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/code",
        i18n: "basket.currency.code",
        options: {
          autoFocus: true,
          autocomplete: "off",
          placeholder: "Select currency..."
        }
      }
    ]
  };

  return schema as UISchemaElement;
};

// -----------------------------------------------------------------------------
// --- currency resolution

/**
 * Maps a browser/active locale to candidate ISO-4217 currency codes. Ported
 * from the legacy cart (utils/money `localeCurrencySuggestions`) — manually
 * maintained. Candidates are later intersected with brand-supported currencies.
 */
function localeCurrencyCandidates(
  locale: string | undefined
): ISO_4217_CURRENCY_CODE[] {
  switch (locale) {
    case WIPLocaleCodes.EN_AU:
      return ["AUD"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.AZ:
      return ["AZN"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.BG:
      return ["BGN"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.FR_CA:
      return ["CAD"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.ZH_TW:
      return ["CNY"] as ISO_4217_CURRENCY_CODE[];
    case WIPLocaleCodes.ES_CO:
      return ["COP", "USD"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.CS:
      return ["CZK"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.DA:
      return ["DKK"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.DE:
    case SupportedLocaleCodes.EL:
    case SupportedLocaleCodes.ES:
    case SupportedLocaleCodes.FR:
    case SupportedLocaleCodes.IT:
    case SupportedLocaleCodes.NL:
    case SupportedLocaleCodes.PT:
    case SupportedLocaleCodes.SK:
      return ["EUR"] as ISO_4217_CURRENCY_CODE[];
    case WIPLocaleCodes.EN_GB:
      return ["GBP"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.HU:
      return ["HUF"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.ID:
      return ["IDR"] as ISO_4217_CURRENCY_CODE[];
    case WIPLocaleCodes.ES_MX:
      return ["MXN", "USD"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.NB:
      return ["NOK"] as ISO_4217_CURRENCY_CODE[];
    case WIPLocaleCodes.EN_NZ:
      return ["NZD"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.UR:
      return ["PKR"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.PL:
      return ["PLN"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.PT_BR:
      return ["BRL"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.RO:
      return ["RON"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.RU:
      return ["RUB"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.SV:
      return ["SEK"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.TR:
      return ["TRY"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.UK:
      return ["UAH"] as ISO_4217_CURRENCY_CODE[];
    case SupportedLocaleCodes.EN_US:
    case SupportedLocaleCodes.ES_419:
      return ["USD"] as ISO_4217_CURRENCY_CODE[];
    case WIPLocaleCodes.AF:
    case WIPLocaleCodes.AF_ZA:
    case WIPLocaleCodes.EN_ZA:
    case WIPLocaleCodes.ZU:
    case WIPLocaleCodes.ZU_ZA:
      return ["ZAR"] as ISO_4217_CURRENCY_CODE[];
    default:
      return [];
  }
}

/**
 * Resolves the first brand-supported currency suggested by the browser locale.
 * Gated by the caller behind `BASKET_DEFAULT_CURRENCY === LANGUAGE`.
 */
function localeCurrency(currencies: ICurrency[]): ICurrency | undefined {
  const locale =
    typeof window !== "undefined" ? window.navigator?.language : undefined;
  const normalised = locale?.replace("_", "-");
  const candidates = localeCurrencyCandidates(normalised);
  if (!candidates.length) return undefined;

  const supportedCodes = map(currencies, "code");
  const matched = first(intersection(candidates, supportedCodes));
  return matched ? find(currencies, { code: matched }) : undefined;
}

/**
 * Resolves the active client's account currency against the brand-supported
 * currencies. Matches on `preferred_payment_currency_id` first, then the
 * account `currency_id`. Returns undefined when unauthenticated, when no
 * account currency is set, or when it is not brand-supported.
 */
function accountCurrency(currencies: ICurrency[]): ICurrency | undefined {
  const { isAuthenticated } = useActiveSession().useMeta();
  if (!isAuthenticated.value) return undefined;

  const { activeUser } = useActiveSession().useContext();
  const account = first(activeUser.value?.accounts);
  if (!account) return undefined;

  const candidateIds = compact([
    account.preferredPaymentCurrencyId,
    account.currencyId
  ]);

  return find(currencies, ({ id }) => candidateIds.includes(id));
}

/**
 * Reads a bare currency code from a storage key.
 */
function getStoredCode(key: string): ICurrency["code"] | undefined {
  const stored = useSessionStorage().get(key);
  return stored ? (stored as ICurrency["code"]) : undefined;
}

/**
 * The stored explicit (hand-picked) currency code, if any. Backs the
 * `hasNoExplicitCurrency` guard and the explicit step of resolution.
 */
export function getExplicitCurrency(): ICurrency["code"] | undefined {
  return getStoredCode(CURRENCY_STORAGE_KEY);
}

/**
 * Persists a hand-picked currency code to the explicit key.
 */
export function persistExplicitCurrency(code?: ICurrency["code"]): void {
  if (!code) return;
  useSessionStorage().set(CURRENCY_STORAGE_KEY, code);
}

/**
 * Persists an auto-resolved currency code to the default key. Mirrors
 * `useLocale` which always writes the resolved locale, so warm reloads can
 * short-circuit on the stored value.
 */
export function persistDefaultCurrency(code?: ICurrency["code"]): void {
  if (!code) return;
  useSessionStorage().set(CURRENCY_DEFAULT_STORAGE_KEY, code);
}

/** Clears only the auto-resolved default — login re-resolves to the account. */
export function clearDefaultCurrency(): void {
  useSessionStorage().remove(CURRENCY_DEFAULT_STORAGE_KEY);
}

/** Clears both currency keys (logout). */
export function clearCurrencyStorage(): void {
  const storage = useSessionStorage();
  storage.remove(CURRENCY_STORAGE_KEY);
  storage.remove(CURRENCY_DEFAULT_STORAGE_KEY);
}

/**
 * Resolves the currency code to seed the machine with. Precedence:
 *   1. Server-side basket currency (the in-context model — always wins)
 *   2. Stored explicit pick (`currency` key — survives login)
 *   3. Stored default (`currency_default` key — warm-reload short-circuit)
 *   4. Computed default (account → locale → brand → first supported), then
 *      stored to `currency_default` so the next reload short-circuits.
 *
 * Login clears the stored default (`clearDefaultCurrency`) so the account
 * currency is recomputed and wins; an explicit pick is never cleared.
 */
export function resolveBaseModel(
  model?: CurrencyModel
): ICurrency["code"] | undefined {
  const { currencies, currency, getConfigValue } = useBrand();
  const supported = currencies.value;

  // 1. server-side basket currency (in-context model) — validate it is supported
  const basketCurrency = model?.code
    ? find(
        supported,
        ({ id, code }) =>
          id === model.id ||
          code === (model.code?.toUpperCase() as ICurrency["code"])
      )
    : undefined;
  if (basketCurrency) return basketCurrency.code;

  // 2. stored explicit pick
  const explicit = find(supported, { code: getExplicitCurrency() });
  if (explicit) return explicit.code;

  // 3. stored default — short-circuit warm reloads
  const cached = find(supported, {
    code: getStoredCode(CURRENCY_DEFAULT_STORAGE_KEY)
  });
  if (cached) return cached.code;

  // 4. compute the default (account → locale → brand) and store it
  const source = getConfigValue<BasketCurrencySource>(
    BrandConfigKeys.BASKET_DEFAULT_CURRENCY
  );
  const computed =
    accountCurrency(supported) ??
    (source === BasketCurrencySource.LANGUAGE
      ? localeCurrency(supported)
      : undefined) ??
    currency.value;

  persistDefaultCurrency(computed?.code);
  return computed?.code;
}
