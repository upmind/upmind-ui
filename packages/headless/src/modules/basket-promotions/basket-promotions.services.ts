/** @internal */
import { asyncDebounce } from "@tanstack/pacer";
import { invalidateQueryByKey, useQuery } from "../query";
import { useI18n } from "../system-localisation";
import {
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../utils";
import { get, some, trim } from "lodash-es";
import type { PromotionsContext } from "./basket-promotions.types";
import type { IBasketPromotion } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load(_context: PromotionsContext, _event: AnyEventObject) {
  // Promotions don't have any initial state to load, so we can pass through an empty object
  return Promise.resolve({});
}

async function add(
  { basketId, model, promotions }: PromotionsContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  const { post, useUrl } = useQuery();

  if (!model?.promocode)
    return Promise.reject(
      new DetailedError(
        t("error.promotion_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  if (some(promotions, { promocode: model?.promocode }))
    return Promise.reject(
      new DetailedError(
        t("error.promocode_add_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  return post<IBasketPromotion[]>({
    mutationKey: ["basket", "promotions"],
    url: useUrl(`/orders/${basketId}/promotions`),
    data: { promocode: trim(model?.promocode) },
    withAccessToken: true
  }).then(invalidateQueryByKey(["basket"], { exact: false }));
}

async function remove(
  { basketId }: PromotionsContext,
  { data }: AnyEventObject
) {
  const { t } = useI18n();
  const id = get(data, "id", data);

  if (!id)
    return Promise.reject(
      new DetailedError(
        t("error.promotion_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const { del, useUrl } = useQuery();

  return del({
    mutationKey: ["basket", "promotions"],
    url: useUrl(`/orders/${basketId}/promotions/${id}`),
    withAccessToken: true
  });
}

async function parse(
  { model, schema }: PromotionsContext,
  _event: AnyEventObject
) {
  // ---
  model = useModelParser(schema, model);

  // we don't have any parsing checks or transforms so we can pass through the model
  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: PromotionsContext,
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
          t("error.promotion_validation_failed"),
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
  add: asyncDebounce(
    (context: PromotionsContext, _event: AnyEventObject) =>
      add(context, _event),
    { wait: DEBOUNCE_DELAY }
  ),
  remove: asyncDebounce(
    (context: PromotionsContext, _event: AnyEventObject) =>
      remove(context, _event),
    { wait: DEBOUNCE_DELAY }
  )
};
