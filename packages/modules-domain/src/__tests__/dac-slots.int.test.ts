// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The domain search page's layout gets the organism's develop blocks
 *
 * ## Job To Be Done
 * On the domain search route, the page's self-closing layout for the template
 * it is handed gets `UpmDac`'s own content in every slot develop fills before a
 * search: the hero, the search, the tabs, the results, the hint and the way on.
 * A slot the page writes on its layout replaces only that slot's content.
 *
 * ## What Breaks If These Fail
 * A guest looking for a domain gets no search box or no way on without one, or
 * a page override pushes out the content around it.
 */

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { DOMAIN_TEMPLATE } from "../index";
import {
  BOOT_BUDGET,
  framesOf,
  layoutOf,
  mountDac,
  seedBasket,
  seedGuestSession,
  slotsOf
} from "./mount-dac";
import { installBootRoutes } from "./recorded-pool";
import { values } from "lodash-es";
import type { DacWrapper } from "./mount-dac";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = ["hero", "search", "tabs", "results", "hint", "resolve"];

const CONTINUE = '[data-test-key="button-continue"]';

const showsContinue = (wrapper: DacWrapper) => wrapper.find(CONTINUE).exists();

const inFrame = (wrapper: DacWrapper, name: string) =>
  wrapper.find(`[data-frame="${name}"]`);

// -----------------------------------------------------------------------------

describe("the domain search page's layout, for the recorded guest with no basket", () => {
  beforeAll(async () => {
    installBootRoutes();
    await seedGuestSession();
    await seedBasket();
  }, BOOT_BUDGET);

  beforeEach(() => {
    installBootRoutes();
  });

  it(
    "hands the layout develop's six blocks",
    async () => {
      const wrapper = await mountDac(showsContinue);

      expect(values(DOMAIN_TEMPLATE)).toContain(layoutOf(wrapper));
      expect(slotsOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
    },
    BOOT_BUDGET
  );

  it(
    "draws the hero, the search, the hint and the way on without a domain, each in its own frame",
    async () => {
      const wrapper = await mountDac(showsContinue);

      expect(
        inFrame(wrapper, "hero").find('[data-test-key="hero-title"]').exists()
      ).toBe(true);
      expect(inFrame(wrapper, "search").text()).toContain("domain.search");
      expect(inFrame(wrapper, "hint").text()).toContain(
        "text.cant_decide_right_qn"
      );
      expect(inFrame(wrapper, "resolve").find(CONTINUE).text()).toContain(
        "domain.domain_not_required_label"
      );
    },
    BOOT_BUDGET
  );

  it(
    "puts the page's own slot in place of its block, and keeps every other block's",
    async () => {
      const wrapper = await mountDac(
        found => found.find('[data-test-key="page-resolve"]').exists(),
        {
          resolve: () => h("p", { "data-test-key": "page-resolve" }, "Page")
        }
      );

      expect(
        inFrame(wrapper, "resolve")
          .find('[data-test-key="page-resolve"]')
          .exists()
      ).toBe(true);
      expect(wrapper.find(CONTINUE).exists()).toBe(false);
      expect(
        inFrame(wrapper, "hero").find('[data-test-key="hero-title"]').exists()
      ).toBe(true);
      expect(framesOf(wrapper)).toContain("hint");
    },
    BOOT_BUDGET
  );
});
