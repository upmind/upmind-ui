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

  // --------------------------------------------------------

  return {
    service, // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: service.getSnapshot,
    destroy: () => service.stop(),
  };
};
