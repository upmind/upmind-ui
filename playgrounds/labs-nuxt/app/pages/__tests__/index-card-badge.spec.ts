/**
 * @module pages/__tests__/index-card-badge.spec
 * @description FE-3125 `D-1`/`D-2`: the homepage's Badge slot migration and
 * Card grammar.
 *
 * The claim under test is CONTENT, not shape. `Badge` wraps reka's `Primitive`
 * and renders `<slot />` alone — it carries no `label` and no `icon` prop
 * (`design-system/packages/ui/src/components/badge/Badge.vue`). So the old
 * `<Badge :label="…" icon="…" />` call rendered an EMPTY badge and fell the two
 * props through onto the root element as literal DOM attributes, while every
 * shape assertion about badge count or card count still passed. This spec
 * therefore reads the rendered text and the fallthrough attributes.
 *
 * The counts are the real derivation: `useNavigation` merges route-declared
 * entries with the live scenario registry, so the page is fed the same way the
 * running app feeds it and no fixture stands in for the registry.
 *
 * @anchor homepage-card.feature
 */

import { mount } from "@vue/test-utils";
import { describe, it, expect, afterEach, vi } from "vitest";
import { computed, ref } from "vue";
import { RouterLink, createRouter, createWebHistory } from "vue-router";
import { filter, isEmpty, map, reject, trim } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

vi.mock("@upmind-automation/headless", async () => {
  const real = await vi.importActual("@upmind-automation/headless");
  return {
    ...real,
    useBrand: () => ({
      brandId: ref("brand-x"),
      name: ref("Brand X"),
      isReady: computed(() => true)
    }),
    useSessionStore: () => ({
      initStore: () => Promise.resolve(),
      useActions: () => ({
        activate: vi.fn(),
        add: () => Promise.resolve(),
        clear: vi.fn(),
        get: vi.fn(),
        getExpiresAt: () => null,
        isReady: () => Promise.resolve(true),
        logout: vi.fn(),
        onLogout: () => () => undefined,
        refresh: () => Promise.resolve(),
        registerImpersonation: vi.fn(),
        remove: vi.fn(),
        updateUser: vi.fn()
      }),
      useContext: () => ({
        activeActor: ref("guest"),
        activeSession: ref(undefined),
        activeSessionId: ref(undefined),
        activeUser: computed(() => undefined),
        allSessions: computed(() => ({})),
        clientSessions: ref({}),
        expiresAt: computed(() => null),
        guestSession: ref(undefined),
        impersonatedSession: computed(() => null),
        impersonatedSessions: ref({}),
        staffSessions: ref({})
      }),
      useInternals: () => ({}),
      useMeta: () => ({
        hasClientSession: computed(() => false),
        hasGuestSession: computed(() => false),
        hasImpersonatedSessions: computed(() => false),
        hasMultipleSessions: computed(() => false),
        hasStaffSession: computed(() => false),
        isAvailable: computed(() => true),
        isLoading: computed(() => false),
        isScopeAllowed: () => true
      })
    })
  };
});

describe("homepage Card grammar and Badge slot migration", () => {
  let wrapper: VueWrapper;

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  /**
   * The page reads `useNavigation`, which reads `useRouter().getRoutes()`, so
   * the router is a real one carrying one `meta.nav` declaration — the seam the
   * running app feeds the page through.
   */
  async function mountHomepage(): Promise<void> {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: "/", name: "home", component: { template: "<div />" } },
        {
          path: "/use-basket",
          name: "useBasket",
          component: { template: "<div />" },
          meta: { nav: { label: "useBasket", section: "Composables" } }
        }
      ]
    });

    await router.push("/");
    await router.isReady();

    const { default: IndexPage } = await import("../index.vue");
    wrapper = mount(IndexPage, {
      attachTo: document.body,
      global: {
        plugins: [router],
        // Nuxt registers `NuxtLink` from its own build, which vitest never
        // boots. `RouterLink` is what `NuxtLink` wraps for an internal route,
        // and it is REAL — it resolves the href off the router above, so the
        // link claim below is the router's own answer, not a stub's.
        components: { NuxtLink: RouterLink }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * @anchor D-1
   */
  describe("badge content renders as slot children", () => {
    // The three header counts are `Stat`, not badges, as of the library sweep:
    // they are metrics, and `Stat` is what the library gives a metric. The
    // claim is unchanged — each one renders its own derived NUMBER beside its
    // label, which the old `:label`-prop badge did not render at all.
    //
    // The first mount in the file pays for transforming the page's whole import
    // graph — `@upmind/ui`, `client-vue` and the scenario registry behind them.
    // Later mounts reuse the cache and land inside the lane's 5s ceiling.
    it(
      "header metrics carry their derived counts as text",
      { timeout: 20000 },
      async () => {
        await mountHomepage();
        const text = wrapper.text();

        expect(text).toMatch(/Composables\s*\d+/);
        expect(text).toMatch(/Families\s*\d+/);
        expect(text).toMatch(/Scenario-covered\s*\d+/);
      }
    );

    it("no element carries a fallthrough label or icon attribute", async () => {
      await mountHomepage();

      // `Badge` declares neither prop, so a surviving `:label`/`icon` binding
      // lands on the root element verbatim — the exact fingerprint of the old
      // API, and invisible to any count-based assertion.
      const leaked = wrapper.element.querySelectorAll("[label], [icon]");
      expect(map(leaked, element => element.outerHTML)).toEqual([]);
    });
  });

  /**
   * @anchor D-2
   * @anchor contract
   */
  describe("scenario grid uses Card grammar", () => {
    it("renders one Card per scenario entry plus the Getting Started card", async () => {
      await mountHomepage();

      const cards = wrapper.element.querySelectorAll("[data-test-key='card']");
      // Every entry the derivation yields is a card, and "Getting Started" is
      // a card of its own — so the grid is never a bare NuxtLink list again.
      expect(cards.length).toBeGreaterThan(1);
    });

    it("every card title renders visible text", async () => {
      await mountHomepage();

      const titles = wrapper.element.querySelectorAll(
        "[data-test-key='card'] h4"
      );
      expect(titles.length).toBeGreaterThan(0);

      const empty = filter(
        map(titles, title => trim(title.textContent ?? "")),
        isEmpty
      );
      expect(empty).toEqual([]);
    });

    it("each scenario card links somewhere", async () => {
      await mountHomepage();

      const links = wrapper.element.querySelectorAll(
        "[data-test-key='card'] a"
      );
      expect(links.length).toBeGreaterThan(0);

      const hrefless = reject(links, link => !!link.getAttribute("href"));
      expect(hrefless.length).toBe(0);
    });
  });

  /**
   * @anchor D-2
   */
  describe("token discipline", () => {
    it("renders no raw token values in inline styles", async () => {
      await mountHomepage();

      const styled = wrapper.element.querySelectorAll("[style]");
      const raw = filter(
        map(styled, element => element.getAttribute("style") ?? ""),
        style => /var\(--(surface|border|text-muted)\)/.test(style)
      );

      expect(raw).toEqual([]);
    });
  });
});
