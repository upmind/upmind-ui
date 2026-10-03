// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview A DAC category's domain search fills the catalogue's own layout
 *
 * ## Job To Be Done
 * In the recorded category that asks for the domain search, the page's
 * catalogue layout, with no domain layout passed, gets the domain search and
 * its results in the frame where the catalogue shows its widget, and neither
 * lands in a footer.
 *
 * ## What Breaks If These Fail
 * A guest in a domain category gets no search box, or no results under it.
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import {
  BOOT_BUDGET,
  mountCatalogue,
  seedBasket,
  seedGuestSession
} from "./mount-catalogue";
import { installBootRoutes, recordedDacCategory } from "./recorded-pool";
import type { CatalogueWrapper } from "./mount-catalogue";

// -----------------------------------------------------------------------------

const SEARCH_INPUT = '[data-test-value="domain-search-input"]';
const RESULTS = { name: "DomainCards" };
const FOOTERS = ["aside-footer", "content-footer"];

const showsSearch = (wrapper: CatalogueWrapper) =>
  wrapper.find(SEARCH_INPUT).exists();

const inFrame = (wrapper: CatalogueWrapper, name: string) =>
  wrapper.find(`[data-frame="${name}"]`);

/** happy-dom has no Web Animations API; the result list's auto-animate calls it. */
const stillAnimation = {
  play: () => undefined,
  cancel: () => undefined,
  addEventListener: () => undefined
};

let mounted: CatalogueWrapper | undefined;

async function browseDacCategory() {
  mounted = await mountCatalogue(showsSearch, undefined, {
    query: { catid: recordedDacCategory?.id ?? "" },
    attachTo: document.body
  });
  return mounted;
}

// -----------------------------------------------------------------------------

describe("the catalogue page's layout, for the recorded DAC category", () => {
  beforeAll(async () => {
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: () => stillAnimation
    });
    installBootRoutes();
    await seedGuestSession();
    await seedBasket();
  }, BOOT_BUDGET);

  beforeEach(() => {
    installBootRoutes();
  });

  afterEach(() => {
    mounted?.unmount();
    mounted = undefined;
  });

  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, "animate");
  });

  it("is a recorded category that asks for the domain search", () => {
    expect(
      recordedDacCategory,
      "the recorded category tree holds no category whose meta asks for the " +
        "DAC widget; re-run `pnpm fixtures:generate product-categories`"
    ).toBeDefined();
  });

  it(
    "draws the domain search and its results in the frame where the catalogue shows its widget",
    async () => {
      const wrapper = await browseDacCategory();
      const results = wrapper.findComponent(RESULTS);

      expect(inFrame(wrapper, "content").find(SEARCH_INPUT).exists()).toBe(
        true
      );
      expect(results.exists(), "the domain search draws no results").toBe(true);
      expect(
        inFrame(wrapper, "content").element.contains(results.element)
      ).toBe(true);
    },
    BOOT_BUDGET
  );

  it(
    "puts neither the search nor the results in a footer",
    async () => {
      const wrapper = await browseDacCategory();
      const results = wrapper.findComponent(RESULTS);

      expect(results.exists()).toBe(true);

      for (const footer of FOOTERS) {
        const frame = inFrame(wrapper, footer);

        expect(frame.exists(), `the layout drew no ${footer} frame`).toBe(true);
        expect(frame.find(SEARCH_INPUT).exists()).toBe(false);
        expect(frame.element.contains(results.element)).toBe(false);
      }
    },
    BOOT_BUDGET
  );
});
