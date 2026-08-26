import { CART_OVERLAYS } from "../router.options";
import cart from "./cart";
import domains from "./domains";
import { getDefaultFunnel } from "./getDefaultFunnel";
import onePage from "./one-page";
import stepped from "./stepped";
import { FUNNEL } from "./types";
import { watchers } from "./watchers";

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
