// --- external
import { interpret } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import { DomainTypes } from "./types.d";
export * from "./types.d";
// --- utils
import { useBasket } from "..";
import { has, find, map } from "lodash-es";
import { isArray } from "xstate/lib/utils";
import { parseDomain } from "./utils";

// --------------------------------------------------------

export const useDomain = (
  {
    model,
    sync,
    type,
    parentId,
  }: {
    model?: Array<string> | string;
    sync?: boolean;
    type?: DomainTypes;
    parentId?: Object; // id of basket item machine representing the parent context
  } = {
    model: [],
    sync: false,
    type: undefined,
    parentId: undefined,
  }
) => {
  // --------------------------------------------------------
  // create a new instance of the  domain machine

  // safetycheck to ensure forcedType is valid
  const safeType = has(DomainTypes, type) ? type : null;
  const safeModel = map(isArray(model) ? model : [model], parseDomain);

  // ---
  const context = {
    type: safeType,
    sync,
    choices: safeType ? null : DomainTypes,
    model: safeModel,
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
      const basketCurrency = currencyActor?.getSnapshot()?.context?.model?.code;
      // ---
      const promotionsActor = state.context?.actors?.promotions;
      const basketPromotions =
        promotionsActor?.getSnapshot()?.context?.model?.promotions;

      // ---
      //  only refresh if the currency or promotions have changed
      const { currency, promotions } = service.getSnapshot().context;
      if (
        (basketCurrency && basketCurrency !== currency) ||
        (basketPromotions && basketPromotions !== promotions)
      ) {
        service.send({
          type: "REFRESH",
          data: {
            currency: basketCurrency,
            promotions: basketPromotions,
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
    destroy: () => service.stop,
  };
};
