// --- internal
import cart from "./cart";
import domains from "./domains";
import { watchers } from "./watchers";
import { CART_OVERLAYS } from "../routes";

// -----------------------------------------------------------------------------

export const registerFunnels = () => {
  return {
    defaultFunnel: "cart",
    funnels: { cart, domains },
    overlays: CART_OVERLAYS,
    watchers
  };
};
