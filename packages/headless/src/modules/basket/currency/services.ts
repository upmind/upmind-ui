// --- external
import { asyncDebounce } from "@tanstack/pacer";

// --- internal
import type { AnyEventObject } from "xstate";
import { useQuery, useBrand, useI18n, invalidateQueryByKey } from "../../..";

// --- utils
import {
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useTime,
  useValidation
} from "../../../utils";
import { useSessionStorage } from "../../../utils/useStorage";
import { find } from "lodash-es";

// --- types
import type { ICurrency } from "@upmind-automation/types";
import type { CurrencyContext, CurrencyModel } from "./types";

// -----------------------------------------------------------------------------
export const CURRENCY_STORAGE_KEY = "currency";

async function load(
  { schema, model }: CurrencyContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  const { currencies, currency, isReady } = useBrand();

  await isReady().catch(error =>
    Promise.reject(
      new DetailedError(
        t("error.brand_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        error
      )
    )
  );

  // --- check sessionStorage for a persisted currency selection
  const storage = useSessionStorage();
  const code = storage.get(CURRENCY_STORAGE_KEY);
  const persistedCurrency = code
    ? find(currencies.value, { code: code })
    : undefined;

  // set our base model to match the persisted or default brand currency
  const baseModel = persistedCurrency
    ? { id: persistedCurrency.id, code: persistedCurrency.code }
    : { id: currency.value?.id, code: currency.value?.code };

  const safeModel = useModelParser<CurrencyModel>(schema, model, baseModel);

  return new Promise(resolve => {
    resolve({
      currencies: currencies.value,
      baseModel: safeModel,
      model: safeModel
    });
  });
}

async function update(
  { basketId, model }: CurrencyContext,
  _event: AnyEventObject
) {
  const { put, useUrl } = useQuery();

  // get returns a promise so we can pass it directly back to the machine
  return put<ICurrency>({
    mutationKey: ["basket", "currency"],
    url: useUrl(`/orders/${basketId}/currency`),
    data: {
      currency_code: model?.code
    },
    withAccessToken: true
  });
}

async function parse(
  { model, schema }: CurrencyContext,
  _event: AnyEventObject
) {
  // ---
  // if we have a valid currency, lets hydrate it base don the code.
  const { validateCurrency } = useBrand();
  const currency = await validateCurrency(model ?? {});

  // TODO: add logic for logged in users account currency....

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel = useModelParser<CurrencyModel>(schema, currency);

  return Promise.resolve({ model: safeModel });
}

async function validate(
  { schema, model }: CurrencyContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.currency_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
    } else {
      resolve(model);
    }
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  parse,
  validate,
  update: asyncDebounce(
    (context: CurrencyContext, _event: AnyEventObject) =>
      update(context, _event),
    { wait: useTime().SECOND, leading: true } // prevent rapid currency changes
  )
};
