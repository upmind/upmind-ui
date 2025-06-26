// --- external

// --- internal
import { useBrand, useQuery, useSession } from "../../..";

// --- utils
import {
  DetailedError,
  responseCodes,
  useValidation,
  useModelParser,
  NotAuthenticatedError,
} from "../../../utils";
import { get, isEqual } from "lodash-es";

// --- types
import { BrandConfigKeys } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
import type { BillingContext, BillingModel } from "./types";
import { dir } from "console";

// -----------------------------------------------------------------------------

async function loadLookups(
  { model, schema }: BillingContext,
  _event: AnyEventObject
) {
  const { ensureConfig } = useBrand();
  const { meta } = useSession();

  if (!meta.value.isAuthenticated)
    return Promise.reject(new NotAuthenticatedError());

  const config = await ensureConfig([
    BrandConfigKeys.CHECKOUT_REQUIRE_PHONE,
    BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS,
    BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS,
  ]).then(config => {
    return {
      requiresPhone: config?.invoices?.common?.require_phone_for_orders,
      requiresCompany: config?.invoices?.common?.require_company_for_orders,
      requiresAddress: config?.invoices?.common?.require_address_for_orders,
    };
  });

  // // We should ALWAYS have an address set  ( if we have addresses )
  // if (!isEmpty(defaultAddress)) {
  //   baseModel = {
  //     addressId: defaultAddress.id,
  //     companyId: defaultAddress?.companyId,
  //     phoneId: defaultPhone?.phoneId,
  //   };
  //   autoupdate = true;
  //   dirty = true;
  // }

  const baseModel: BillingModel = {
    addressId: undefined,
    companyId: undefined,
    phoneId: undefined,
  };

  const safeModel = useModelParser<BillingModel>(schema, model, baseModel);

  return Promise.resolve({
    config,
    model: safeModel,
    baseModel: safeModel,
  });
}

async function parse(
  { autoupdate, schema, baseModel }: BillingContext,
  { data }: AnyEventObject
) {
  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel = useModelParser<BillingModel, BillingModel>(
    schema,
    get(data, "model", data)
  );

  // ---
  // we dont have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({
    model: safeModel,
    autoupdate,
  });
}

async function validate(
  { schema, model }: BillingContext,
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

async function update(
  { basketId, model }: BillingContext,
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
      phone_id: model?.phoneId || null,
    },
    withAccessToken: true,
  });
}
// -----------------------------------------------------------------------------

export default {
  loadLookups,
  parse,
  update,
  validate,
};
