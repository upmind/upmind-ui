// --- external
import { assign } from "xstate";

// --- types
import type { MercadoPagoContext } from "./types";

// -----------------------------------------------------------------------------

export default {
  cleanupSdk: assign({
    sdk: ({ sdk }: MercadoPagoContext) => {
      if (sdk?.mercadoPagoController) {
        try {
          sdk.mercadoPagoController.unmount();
        } catch {
          // SDK may have already cleaned up internally; cleanup must not throw,
          // as that would abort the surrounding xstate transition mid-flight.
        }
      }
      return undefined;
    }
  })
};
