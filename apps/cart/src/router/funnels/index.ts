// --- internal
import cart from "./cart";
import domains from "./domains";
import { watchers } from "./watchers";

// -----------------------------------------------------------------------------
export const registerFunnels = () => {
  return {
    funnels: { cart, domains },
    defaultFunnel: "cart",
    watchers
  };
};
