// --- external

// --- internal
import {
  useApi,
  useClientAddresses,
  useClientCompanies,
  useSession,
} from "../../..";

// --- utils
import { useValidation } from "../../../utils";
import { omitBy, isNil } from "lodash-es";
// --- types
import type { BillingDetailsEvent, BillingDetailsContext } from "./types.d";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(
  _context: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  const { isAuthenticated } = useSession();
  await isAuthenticated().catch(() =>
    Promise.reject({ title: "Unauthorized", code: 401 })
  );

  const { isReady: isAddressesReady, getItems: getAddresses } =
    useClientAddresses();

  const { isReady: isCompaniesReady, getItems: getCompanies } =
    useClientCompanies();

  return Promise.all([isAddressesReady(), isCompaniesReady()]).then(() => {
    const addresses = getAddresses();
    const companies = getCompanies();

    return new Promise((resolve, reject) => {
      if (addresses?.length || companies?.length) {
        resolve({ addresses, companies });
      } else {
        reject("No Companies or Addresses Available");
      }
    });
  });
}

// --------------------------------------------------------
async function update(
  { basket_id, model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  const { put, useUrl } = useApi();

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basket_id}`),
    data: {
      address_id: model?.address_id || null,
      company_id: model?.company_id || null,
    },
    withAccessToken: true,
  });
}

// --------------------------------------------------------

async function parse(
  { model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model: omitBy(model, isNil) });
}

async function validate(
  { schema, model }: BillingDetailsContext,
  _event: BillingDetailsEvent
) {
  // ---

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
