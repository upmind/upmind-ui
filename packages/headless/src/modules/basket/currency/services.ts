// --- external

// --- internal
import type { AnyEventObject } from "xstate";
import { useQuery, useBrand } from "../../..";

// --- utils
import { useValidation } from "../../../utils";

// --- types
import type { CurrencyContext } from "./types";

// -----------------------------------------------------------------------------

async function load(_context: CurrencyContext, _event: AnyEventObject) {
  const { getCurrencies, getCurrency, isReady } = useBrand();

  await isReady().catch(error => Promise.reject(error));
  const currencies = getCurrencies();

  // set our base model to match the default brand currency
  const baseModel = getCurrency();

  return new Promise(resolve => {
    resolve({ currencies, baseModel });
  });
}

async function update(
  { basketId, model }: CurrencyContext,
  _event: AnyEventObject
) {
  const { put, useUrl } = useQuery();

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basketId}/currency`),
    data: {
      currency_code: model?.code,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function parse({ model }: CurrencyContext, _event: AnyEventObject) {
  // ---
  // if we have a valid currency, lets hydrate it base don the code.
  const { validateCurrency } = useBrand();
  const currency = await validateCurrency(model);
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
      reject({ error: errors });
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
