// --- external
import { interpret } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import { DomainTypes } from "./types.d";
export * from "./types.d";
// --- utils
import { useBasketHelper, useBasket } from "..";
import { has, find, map } from "lodash-es";
import { isArray } from "xstate/lib/utils";
import { parseDomain } from "./utils";

// --------------------------------------------------------

export const useDomain = (
  {
    values,
    sync,
    type,
    parentId,
  }: {
    values?: Array<string> | string;
    sync?: boolean;
    type?: DomainTypes;
    parentId?: Object; // id of basket item machine representing the parent context
  } = {
    values: [],
    sync: false,
    type: undefined,
    parentId: undefined,
  }
) => {
  // --------------------------------------------------------
  // create a new instance of the  domain machine

  // safetycheck to ensure forcedType is valid
  const safeType = has(DomainTypes, type) ? type : null;
  const safeValues = map(isArray(values) ? values : [values], parseDomain);

  // ---
  const context = {
    type: safeType,
    sync,
    // ---
    choices: safeType ? null : DomainTypes,
    values: safeValues,
    available: [],
    total: 0,
    // ---
    search: null,
    currency: null,
    promotions: [],
    limit: 10,
    offset: 0,
    controller: null,
    // ---
    error: null,
  };

  const service = interpret(domainMachine.withContext(context), {
    devTools: true,
  }).start();

  // --------------------------------------------------------
  // Get the basket machine and watch for changes, ie basket is updated/refreshed
  // and get the currency and promotions to update our domain prices
  const { service: basket } = useBasket();

  basket.onTransition(state => {
    if (state.matches("shopping.refreshing.complete")) {
      // ---
      const currencyActor = state.context?.actors?.currency;
      const currency = currencyActor?.getSnapshot()?.context?.model?.code;
      // ---
      const promotionsActor = state.context?.actors?.promotions;
      const promotions =
        promotionsActor?.getSnapshot()?.context?.model?.promotions;

      // ---
      //  only refresh if the currency or promotions have changed
      if (
        (currency || promotions) &&
        (currency !== service.getSnapshot().context.currency ||
          promotions !== service.getSnapshot().context.promotions)
      ) {
        service.send({
          type: "REFRESH",
          data: {
            currency,
            promotions,
          },
        });
      }
      // ---
      // if (sync) {
      //   const itemActors = state.context?.items;
      //   const domains = map(itemActors, item => {
      //     return {
      //       product_id: item.getSnapshot().context.model.product_id,
      //       sld: item.getSnapshot().context.model.provision_fields.sld,
      //     };
      //   });
      // }
    }
  });

  // --------------------------------------------------------

  return {
    service, // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: service.getSnapshot,
    destroy: service.stop,
  };
};
