// --- external
import { asyncDebounce } from "@tanstack/pacer";

// --- internal
import { invalidateQueryByKey, useI18n, useQuery } from "../../..";

// --- utils
import {
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../../utils";
import { every, get, includes, last, map, reduce, some, trim } from "lodash-es";

// --- types
import type { PromotionModel, PromotionsContext } from "./types";
import type { AnyEventObject } from "xstate";
import type { IBasket, IBasketPromotion } from "@upmind-automation/types";

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

/**
 * Adds several codes in one request. The endpoint skips a code it can't apply
 * and still answers 200, so a code missing from the answer is a failure.
 */
async function addMany(
  { basketId }: PromotionsContext,
  models: PromotionModel[] = []
) {
  const { t } = useI18n();
  const { put, useUrl } = useQuery();

  return put<IBasket>({
    mutationKey: ["basket", "promotions"],
    url: useUrl(`/orders/${basketId}`),
    data: { promotions: models },
    withAccessToken: true
  }).then(basket => {
    const applied = map(basket?.promotions, "promotion.code");
    if (every(models, ({ promocode }) => includes(applied, promocode)))
      return basket;

    return Promise.reject(
      new DetailedError(
        t("error.promotion_add_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  });
}

/**
 * Replaces the basket's promotions: removes each one, then adds the rejected
 * `model` after a combination conflict, or the last `history` set in one
 * request on SWAP. If the add fails, the `baseModel` codes are put back before
 * the error is rethrown.
 */
async function swap(context: PromotionsContext, event: AnyEventObject) {
  const { promotions, baseModel, history, model } = context;

  return reduce(
    promotions,
    (chain: Promise<unknown>, { id }) =>
      chain.then(() => remove(context, { ...event, data: { id } })),
    Promise.resolve()
  )
    .then(
      (): Promise<unknown> =>
        event.type === "SWAP"
          ? addMany(context, last(history))
          : add({ ...context, promotions: [], model }, event)
    )
    .catch(error =>
      addMany(context, baseModel)
        .catch(() => undefined)
        .then(() => Promise.reject(error))
    );
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
  swap,
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
