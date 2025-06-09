// --- external

// --- internal
import {
  useBrand,
  useQuery,
  useSystem,
  useSession,
  useClientAddresses,
  useClientCompanies,
  useClientPhones,
} from "../../..";
import { find, isEmpty } from "lodash-es";

// --- utils
import { DetailedError, responseCodes, useValidation } from "../../../utils";

// --- types
import { BrandConfigKeys } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
import type { BillingDetailsContext } from "./types";

// -----------------------------------------------------------------------------

async function load(_context: BillingDetailsContext, _event: AnyEventObject) {
  const { ensureConfig } = useBrand();
  const { fetchCountries } = useSystem();
  const { isAuthenticated } = useSession();

  await Promise.allSettled([
    fetchCountries(),
    ensureConfig([
      BrandConfigKeys.CHECKOUT_REQUIRE_PHONE,
      BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS,
      BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS,
    ]),
  ]);

  await isAuthenticated().catch(error => Promise.reject(error));
  const { getAll: getAddresses } = useClientAddresses();
  const { getAll: getCompanies } = useClientCompanies();
  const { getAll: getPhones } = useClientPhones();

  const addresses = getAddresses({ allowStale: false });
  const companies = getCompanies({ allowStale: false });
  const phones = getPhones({ allowStale: false });

  return Promise.all([companies, addresses, phones]).then(
    ([companies, addresses, phones]) => {
      return { companies, addresses, phones };
    }
  );
}

async function update(
  { basketId, model }: BillingDetailsContext,
  _event: AnyEventObject
) {
  const { put, useUrl } = useQuery();

  if (!model?.addressId)
    return Promise.reject(
      new DetailedError("No addressId", responseCodes.Unprocessable_Entity)
    );

  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basketId}`),
    data: {
      address_id: model?.addressId,
      company_id: model?.companyId || null,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function parse(
  { model, autoupdate, dirty, addresses, phones }: BillingDetailsContext,
  _event: AnyEventObject
) {
  const defaultAddress = find(addresses, "meta.isDefault");
  const defaultPhone = find(phones, "meta.isDefault");

  // We should ALWAYS have an address set  ( if we have addresses )
  // if model is not set, set it to the default address
  if (!model?.addressId && !isEmpty(defaultAddress)) {
    model = {
      addressId: defaultAddress.id,
      companyId: defaultAddress.companyId,
    };
    autoupdate = true;
    dirty = true;
  }

  if (model && !model?.phoneId && !isEmpty(defaultPhone)) {
    model.phoneId = defaultPhone.id;
  }

  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model, autoupdate, dirty });
}

async function validate(
  { schema, model }: BillingDetailsContext,
  _event: AnyEventObject
) {
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
  update,
  validate,
};
