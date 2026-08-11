import labs from "./labs";
import { ROUTE } from "./types";

export * from "./types";

// -----------------------------------------------------------------------------

/**
 * The overlay routes, keyed by the path suffix they are injected under. The
 * router registration (`registerOverlayRoutes`) and the funnel's endpoint nodes
 * read the same map, so `<parent>--auth` resolves in both.
 */
export const LABS_OVERLAYS: Record<string, string> = {
  auth: ROUTE.OVERLAY_AUTH
};

export const registerFunnels = () => {
  return { funnels: { labs }, defaultFunnel: "labs", overlays: LABS_OVERLAYS };
};
