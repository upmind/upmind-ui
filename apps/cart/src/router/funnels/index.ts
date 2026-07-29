// --- internal
import cart from "./cart";
import stepped from "./stepped";
import onePage from "./one-page";
import domains from "./domains";
import { getDefaultFunnel } from "./getDefaultFunnel";
import { FUNNEL } from "./types";
import { watchers } from "./watchers";
import { CART_OVERLAYS } from "../routes";

// -----------------------------------------------------------------------------

export const registerFunnels = () => {
  return {
    defaultFunnel: getDefaultFunnel(),
    funnels: {
      [FUNNEL.CART]: cart,
      [FUNNEL.STEPPED]: stepped,
      [FUNNEL.ONE_PAGE]: onePage,
      [FUNNEL.DOMAINS]: domains
    },
    overlays: CART_OVERLAYS,
    watchers
  };
};
