// --- external

// --- internal
import { find, isEmpty } from "lodash-es";
import { useApi, useClientUnifiedAddresses, useSession } from "../../..";

// --- utils
import { useValidation } from "../../../utils";
// --- types
import type { BillingDetailsContext } from "./types";
import type { AnyEventObject } from "xstate";

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(_context: BillingDetailsContext, _event: AnyEventObject) {
  const { isAuthenticated } = useSession();

  await isAuthenticated().catch(error => Promise.reject(error));

  const { isReady, getItems } = useClientUnifiedAddresses();

  return isReady().then(() => {
    const addresses = getItems();

    return { addresses };
  });
}

// --------------------------------------------------------
async function update(
  { basketId, model }: BillingDetailsContext,
  _event: AnyEventObject
) {
  const { put, useUrl } = useApi();

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basketId}`),
    data: {
      address_id: model?.addressId || null,
      company_id: model?.companyId || null,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------

async function parse(
  { model, addresses }: BillingDetailsContext,
  _event: AnyEventObject
) {
  const defaultAddress = find(addresses, "default");

  // We should ALWAYs have an address set  ( if we have addresses )
  // if model is not set, set it to the default address
  if (!model?.addressId && !isEmpty(defaultAddress)) {
    model = {
      addressId: defaultAddress.id,
      companyId: defaultAddress.company_id,
    };
  }

  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: BillingDetailsContext,
  _event: AnyEventObject
) {
  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);

    if (errors?.length) {
      reject({ error: errors });
    } else {
      resolve(model);
    }
  });
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  parse,
  validate,
  update,
};
