/** @internal */
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes,
  useModelParser,
  useValidation
} from "../../utils";
import { get } from "lodash-es";
import type { BillingContext, BillingModel } from "./basket-billing.types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function loadLookups(
  { model, schema }: BillingContext,
  _event: AnyEventObject
) {
  const { ensureConfig } = useBrand();
  const { isAuthenticated } = useActiveSession().useMeta();

  if (!isAuthenticated.value)
    return Promise.reject(new NotAuthenticatedError());

  const config = await ensureConfig([
    BrandConfigKeys.CHECKOUT_REQUIRE_PHONE,
    BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS,
    BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS
  ]).then(config => ({
    requiresPhone: get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE),
    requiresCompany: get(config, BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS),
    requiresAddress: get(config, BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS)
  }));

  // // We should ALWAYS have an address set (if we have addresses)
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
    addressId: null,
    companyId: null,
    phoneId: null
  };

  const safeModel = useModelParser<BillingModel>(schema, model, baseModel);

  return Promise.resolve({
    config,
    model: safeModel,
    baseModel: safeModel
  });
}

async function parse(
  { autoupdate, schema, model }: BillingContext,
  { data }: AnyEventObject
) {
  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel = useModelParser<BillingModel, BillingModel>(
    schema,
    get(data, "model", data) ?? model
  );

  // ---
  // we don't have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({
    model: safeModel,
    autoupdate
  });
}

async function validate(
  { schema, model }: BillingContext,
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
          t("error.billing_validation_failed"),
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

async function update(
  { basketId, model }: BillingContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  const { put, useUrl } = useQuery();

  if (!model?.addressId)
    return Promise.reject(
      new DetailedError(
        t("error.client_address_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // get returns a promise so we can pass it directly back to the machine
  return put({
    mutationKey: ["basket", "billing"],
    url: useUrl(`/orders/${basketId}`),
    data: {
      address_id: model?.addressId,
      company_id: model?.companyId || null,
      phone_id: model?.phoneId || null
    },
    withAccessToken: true
  });
}
// -----------------------------------------------------------------------------

export default {
  loadLookups,
  parse,
  update,
  validate
};
