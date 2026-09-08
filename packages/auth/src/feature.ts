/**
 * @module auth/feature
 * @description This package's ADR 023 §8 contribution. The entries live HERE,
 * never in `foundation` — an entry declared there would make
 * `foundation → auth`, and `auth → foundation` already holds (§2
 * registry-ownership).
 */
import { defineFeature } from "@upmind-automation/foundation";
import { registerAuthFlows } from "./flows";
import { authRoutes } from "./routes";
import type { AuthRoutesOptions } from "./routes";

export type AuthFeatureOptions = AuthRoutesOptions & {
  /**
   * Contribute this package's own route records. A host that already owns its
   * auth pages (cart, cart-nuxt) sets this false and keeps its own paths.
   */
  routes?: boolean;
};

export const defineAuthFeature = (options: AuthFeatureOptions = {}) =>
  defineFeature({
    name: "auth",
    setup(ctx) {
      // ADR 023 Amendment 2 ruling 1 assigns every Upmind-domain renderer to
      // another box (payment, product, domain, catalogue, client), so this one
      // contributes none. The call stays so the shape is the same everywhere.
      ctx.addRenderers([]);

      const contributesRoutes = options.routes ?? true;
      if (contributesRoutes) ctx.addRoutes(authRoutes(options));

      ctx.registerFlows(registerAuthFlows);
    }
  });

/** The default contribution, named for consumers that cannot reach a default. */
export const clientAuthFeature = defineAuthFeature();

export default clientAuthFeature;
