/** @internal */
import { asyncDebounce } from "@tanstack/pacer";
import { useBrand } from "../brand";
import { useI18n } from "../system-localisation";
import { useQuery } from "../query";
import { useSessionStorage } from "../../utils/useStorage";
import { resolveBaseModel } from "./basket-currency.utils";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useTime,
  useValidation
} from "../../utils";
import { find } from "lodash-es";
import type { CurrencyContext, CurrencyModel } from "./basket-currency.types";
import type { ICurrency } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load(
  { schema, model }: CurrencyContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  const { currencies, isReady } = useBrand();

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

  // Resolve the seed currency code (basket → explicit → stored default →
  // account/locale/brand). resolveBaseModel stores the computed default itself
  // so warm reloads short-circuit; then hydrate the full model from the code.
  const code = resolveBaseModel(model);

  const baseModel: CurrencyModel = find(currencies.value, { code }) ?? { code };
  const safeModel = useModelParser<CurrencyModel>(schema, baseModel, baseModel);

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
  // Hydrate the current model against the brand's supported currencies. The
  // initial seed (including account/locale resolution) is owned by `load`; this
  // validates SET-driven changes and never overrides an in-session user pick.
  const { validateCurrency } = useBrand();
  const currency = await validateCurrency(model ?? {});

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
