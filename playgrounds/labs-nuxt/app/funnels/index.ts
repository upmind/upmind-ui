import labs from "./labs";
import { ROUTE } from "./types";

export * from "./types";

// -----------------------------------------------------------------------------

/**
 * The overlay routes, keyed by the path suffix they are injected under. The
 * router registration (`registerOverlayRoutes`) and the funnel's endpoint nodes
 * read the same map, so `<parent>--session` resolves in both.
 *
 * The suffix is `session`, NOT `auth`: the child is injected under EVERY page,
 * and the homepage is `/:brandIdOrOrg?`, so an `auth` suffix put its child on
 * `/:brandIdOrOrg?/auth` — the very path `pages/auth/index.vue` already holds.
 * Same rank, so vue-router kept insertion order, the page won, and the
 * homepage's own overlay resolved to SESSION and bounced to register. Deeper
 * pages never collided, which is why the pool worked everywhere but home.
 */
export const LABS_OVERLAYS: Record<string, string> = {
  session: ROUTE.OVERLAY_AUTH
};

export const registerFunnels = () => {
  return { funnels: { labs }, defaultFunnel: "labs", overlays: LABS_OVERLAYS };
};
