// --- external
import { interpret } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import { DomainTypes } from "./types";
export * from "./types";
// --- utils
import { useBasket } from "..";
import { has, map, isArray } from "lodash-es";
import { parseDomain } from "./utils";

// --------------------------------------------------------

export const useDomain = (
  {
    model,
    sync,
    type,
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
  // @ts-ignore
  const safeType = has(DomainTypes, type) ? type : null;
  const safeModel = map(isArray(model) ? model : [model], parseDomain);

  // ---
  const context = {
    type: safeType,
    sync,
    choices: safeType ? null : DomainTypes,
    model: safeModel,
  };

  // @ts-ignore
  const service = interpret(domainMachine.withContext(context), {
    devTools: true,
  }).start();

  // --------------------------------------------------------
  // Get the basket machine and watch for changes, ie basket is updated/refreshed
  // and get the currency and promotions to update our domain prices
  const { service: basket } = useBasket();

  basket.onTransition(state => {
    if (state.matches("shopping.refreshing.processed")) {
      // ---
      const currencyActor: any = state.context?.actors?.currency;
      const basketCurrency = currencyActor?.getSnapshot()?.context?.model?.code;
      // ---
      const promotionsActor: any = state.context?.actors?.promotions;
      const basketPromotions =
        promotionsActor?.getSnapshot()?.context?.model?.promotions;

      const basketProducts = state.context?.products || [];
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
            products: basketProducts,
          },
        });
      }
    }
  });

  // --------------------------------------------------------

  return {
    service, // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: service.getSnapshot,
    destroy: () => service.stop(),
  };
};
