// --- external

// --- internal
import type { AnyEventObject } from "xstate";
import { useQuery, useBrand } from "../../..";

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useValidation,
} from "../../../utils";

// --- types
import type { CurrencyContext } from "./types";
import { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

async function load(_context: CurrencyContext, _event: AnyEventObject) {
  const { currencies, currency, isReady } = useBrand();

  await isReady().catch(error =>
    Promise.reject(
      new DetailedError(
        "[headless] Brand not ready",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { error }
      )
    )
  );

  // set our base model to match the default brand currency
  const baseModel = currency.value;

  return new Promise(resolve => {
    resolve({ currencies: currencies.value, baseModel });
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
      currency_code: model?.code,
    },
    withAccessToken: true,
  });
}

async function parse({ model }: CurrencyContext, _event: AnyEventObject) {
  // ---
  // if we have a valid currency, lets hydrate it base don the code.
  const { validateCurrency } = useBrand();
  const currency = await validateCurrency(model ?? {});
  return Promise.resolve({ model: currency });
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
          "[headless] Invalid Currency Model",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          { model, schema, errors }
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
  update,
};
