// -----------------------------------------------------------------------------
/**
 * @module client-vue/feature
 * @description The Upmind-domain form renderers, contributed through ADR 023
 * §8 rather than imported by the form host.
 *
 * Registering AND installing here is deliberate. The host that used to import
 * `formRenderers` directly now reads `foundation`'s §7 socket, and this package
 * still serves apps that will never be rewired (they retire in their own
 * phase). Leaving installation to the app would drop every domain renderer from
 * those apps silently — the one failure this cut must not cause.
 *
 * ADR 023 Amendment 2 ruling 1 disperses these entries to `payment`,
 * `product`, `domain`, `catalogue` and `client` in their own phases; this file
 * shrinks to nothing as they leave.
 */
import { defineFeature, useFeatures } from "@upmind-automation/foundation";
import { formRenderers } from "./components/form/renderers";

export const clientVueFeature = defineFeature({
  name: "client-vue",
  setup(ctx) {
    ctx.addRenderers(formRenderers);
  }
});

useFeatures().register(clientVueFeature);
useFeatures().install();
