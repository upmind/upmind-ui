// --- external
import { interpret } from "xstate";

// --- internal
import recommendationsEngine from "./recommendationsEngine.machine";
export * from "./types";
// --- utils
import { useBasket } from "..";

// --------------------------------------------------------

export const useRecommendationsEngine = (productId: string) => {
  // --------------------------------------------------------
  // create a new instance of the  recommendationsEngine machine

  // ---
  const context = {
    productId,
  };

  // @ts-ignore
  const service = interpret(recommendationsEngine.withContext(context), {
    devTools: true,
  }).start();

  // --------------------------------------------------------
  // Get the basket machine and watch for changes, ie basket is updated/refreshed
  // and get the currency and promotions to update our recommendationsEngine prices
  const { service: basket } = useBasket();

  basket.onTransition(state => {
    if (state.matches("shopping.refreshing.complete")) {
      // ---
      const currencyActor: any = state.context?.actors?.currency;
      const basketCurrency = currencyActor?.getSnapshot()?.context?.model?.code;
      // ---
      const promotionsActor: any = state.context?.actors?.promotions;
      const basketPromotions =
        promotionsActor?.getSnapshot()?.context?.model?.promotions;

      // ---
      //  only refresh if the currency or promotions have changed
      const { currencyId, promotions } = service.getSnapshot().context;
      if (
        (basketCurrency && basketCurrency?.id !== currencyId) ||
        (basketPromotions && basketPromotions !== promotions)
      ) {
        service.send({
          type: "REFRESH",
          data: {
            currencId: basketCurrency.id,
            promotions: basketPromotions,
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
