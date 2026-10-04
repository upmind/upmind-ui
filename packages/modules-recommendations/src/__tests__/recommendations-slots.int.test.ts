// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The recommendations pages' layout gets the brand's template and the organism's develop blocks
 *
 * ## Job To Be Done
 * On both recommendations routes, the organism's default slot hands the page
 * one value, the brand's template setting as the brand wrote it, even a name no
 * page layout carries. The page's self-closing layout gets the organism's own
 * content in every slot develop fills: the hero, the cards and the configure
 * block, and no footer while there is nothing to recommend. The page's own hero
 * on the organism replaces the develop hero, and a slot the page writes on its
 * layout replaces only that slot's content.
 *
 * ## What Breaks If These Fail
 * The page cannot pick the brand's layout, a guest with nothing to recommend
 * sees no way on, the hero vanishes, or a page override pushes out the content
 * around it.
 */

import { Interstitial } from "@upmind/ui";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { Hero } from "@upmind-automation/foundation";
import { UpmProductRecommendations, UpmRecommendations } from "../index";
import {
  BOOT_BUDGET,
  framesOf,
  mountRecommendations,
  seedBasket,
  seedGuestSession,
  slotScopeOf,
  slotsOf
} from "./mount-recommendations";
import { installBootRoutes, RECORDED_TEMPLATE } from "./recorded-pool";
import type { RecommendationsWrapper } from "./mount-recommendations";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = ["hero", "cards", "configure"];

const PAGE_TEMPLATES = ["full"];

const inFrame = (wrapper: RecommendationsWrapper, name: string) =>
  wrapper.find(`[data-frame="${name}"]`);

const ORGANISMS = [
  ["UpmRecommendations", UpmRecommendations],
  ["UpmProductRecommendations", UpmProductRecommendations]
] as const;

// -----------------------------------------------------------------------------

describe.each(ORGANISMS)(
  "%s's layout, for the recorded guest with no basket",
  (_name, organism) => {
    beforeAll(async () => {
      installBootRoutes();
      await seedGuestSession();
      await seedBasket();
    }, BOOT_BUDGET);

    beforeEach(() => {
      installBootRoutes();
    });

    it(
      "hands the page the brand's template, a name no page layout carries, as the brand wrote it",
      async () => {
        const wrapper = await mountRecommendations(organism);

        expect(PAGE_TEMPLATES).not.toContain(RECORDED_TEMPLATE);
        expect(slotScopeOf(wrapper)).toEqual({ template: RECORDED_TEMPLATE });
      },
      BOOT_BUDGET
    );

    it(
      "hands the layout develop's hero, cards and configure, and no footer",
      async () => {
        const wrapper = await mountRecommendations(organism);

        expect(slotsOf(wrapper)).toEqual(
          expect.arrayContaining(DEVELOP_BLOCKS)
        );
        expect(slotsOf(wrapper)).not.toContain("footer");
      },
      BOOT_BUDGET
    );

    it(
      "draws the hero and the nothing-to-recommend notice, and no frame for an empty configure",
      async () => {
        const wrapper = await mountRecommendations(organism);

        expect(inFrame(wrapper, "hero").findComponent(Hero).exists()).toBe(
          true
        );
        expect(framesOf(wrapper)).toContain("cards");
        expect(wrapper.findComponent(Interstitial).exists()).toBe(true);
        expect(framesOf(wrapper)).not.toContain("configure");
      },
      BOOT_BUDGET
    );

    it(
      "draws the page's own hero in the hero frame",
      async () => {
        const wrapper = await mountRecommendations(organism, undefined, {
          hero: () => h("p", { "data-test-key": "page-hero" }, "Page")
        });

        expect(
          inFrame(wrapper, "hero").find('[data-test-key="page-hero"]').exists()
        ).toBe(true);
        expect(inFrame(wrapper, "hero").findComponent(Hero).exists()).toBe(
          false
        );
      },
      BOOT_BUDGET
    );

    it(
      "puts the page's own layout slot in place of its block, and keeps every other block's",
      async () => {
        const wrapper = await mountRecommendations(organism, {
          hero: () => h("p", { "data-test-key": "page-hero" }, "Page")
        });

        expect(
          inFrame(wrapper, "hero").find('[data-test-key="page-hero"]').exists()
        ).toBe(true);
        expect(inFrame(wrapper, "hero").findComponent(Hero).exists()).toBe(
          false
        );
        expect(framesOf(wrapper)).toContain("cards");
        expect(wrapper.findComponent(Interstitial).exists()).toBe(true);
      },
      BOOT_BUDGET
    );
  }
);
