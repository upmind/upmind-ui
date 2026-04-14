// --- types
import type { MercadoPagoContext } from "./types";

// -----------------------------------------------------------------------------

export default {
  cleanupSdk: ({ sdk }: MercadoPagoContext) => {
    if (sdk?.mercadoPagoController) {
      sdk.mercadoPagoController.unmount();
      sdk.mercadoPagoController = undefined;
    }
  }
};
