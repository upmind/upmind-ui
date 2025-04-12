// --- external

// --- internal
import { useQuery, useClientAddresses, useClientCompanies } from "../../..";
import { find, isEmpty } from "lodash-es";

// --- utils
import { useValidation } from "../../../utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { BillingDetailsContext } from "./types";

// -----------------------------------------------------------------------------

async function load(_context: BillingDetailsContext, _event: AnyEventObject) {
  const { getAll: getAddresses } = useClientAddresses();
  const { getAll: getCompanies } = useClientCompanies();

  const addresses = getAddresses({ allowStale: false });
  const companies = getCompanies({ allowStale: false });

  return Promise.all([companies, addresses]).then(
    ([companies, addresses]) => {
      return [...companies, ...addresses];
    } // we prioritise/return the companies first so they are at the top of the list
  );
}

async function update(
  { basketId, model }: BillingDetailsContext,
  _event: AnyEventObject
) {
  const { put, useUrl } = useQuery();

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

async function parse(
  { model, addresses }: BillingDetailsContext,
  _event: AnyEventObject
) {
  const defaultAddress = find(addresses, "default");

  // We should ALWAYS have an address set  ( if we have addresses )
  // if model is not set, set it to the default address
  if (!model?.addressId && !isEmpty(defaultAddress)) {
    model = {
      addressId: defaultAddress.id,
      companyId: defaultAddress.company_id,
    };
  }

  // ---
  // we don't have any parsing checks or transforms so we can pass through the model
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

// -----------------------------------------------------------------------------

export default {
  load,
  parse,
  update,
  validate,
};
