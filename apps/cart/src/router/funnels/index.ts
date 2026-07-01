import { CART_OVERLAYS } from "../routes";
import cart from "./cart";
import domains from "./domains";
import { watchers } from "./watchers";

// -----------------------------------------------------------------------------

export const registerFunnels = () => {
  return {
    defaultFunnel: "cart",
    funnels: { cart, domains },
    overlays: CART_OVERLAYS,
    watchers
  };
};
