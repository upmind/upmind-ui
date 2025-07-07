// --- external

// --- internal
import type { AnyEventObject } from "xstate";
import { useQuery, useBrand } from "../../..";

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../../utils";

// --- types
import type { CurrencyContext, CurrencyModel } from "./types";
import { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

async function load(
  { schema, model }: CurrencyContext,
  _event: AnyEventObject
) {
  const { currencies, currency, isReady } = useBrand();

  await isReady().catch(error =>
    Promise.reject(
      new DetailedError(
        "Brand not ready",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        error
      )
    )
  );

  // set our base model to match the default brand currency
  const baseModel = {
    id: currency.value?.id,
    code: currency.value?.code
  };

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

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel = useModelParser<CurrencyModel>(schema, currency);

  return Promise.resolve({ model: safeModel });
}

async function validate(
  { schema, model }: CurrencyContext,
  _event: AnyEventObject
) {
  // ---

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);

    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          "Currency validation failed",
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
  update
};
