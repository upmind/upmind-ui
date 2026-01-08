// --- internal
import cart from "./cart";
import domains from "./domains";

// -----------------------------------------------------------------------------
export const registerFunnels = () => {
  return {
    funnels: { cart, domains },
    defaultFunnel: "cart"
  };
};
