// -----------------------------------------------------------------------------
/**
 * @module tests/logged-out-shell
 * @description The frames the logged-out screens render in: the `logged-out`
 * layout, and the auth template the sign-in pages draw. None of the signed-in
 * chrome reaches either — no primary nav, no side rail — and everything they DO
 * carry is the brand's own: its wordmark, the shortcut to its store, its footer
 * line, and the platform's line only where the brand lets it show. The layout
 * reads the portal's mock brand; the auth template reads the brand the sign-in
 * form runs on. Every value is set in the test, so no arm reads the seed back.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, h, nextTick, reactive } from "vue";
import { ClientTemplateSlotCodes } from "@upmind-automation/types";
import { stubMatchMedia } from "./support/theme-harness";
import {
  assign,
  compact,
  filter,
  find,
  head,
  isArray,
  isUndefined,
  map,
  size,
  split
} from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type { MockDataset } from "~/portal/mock/types";
import { NuxtLink } from "#components";
import { usePortalConfig } from "~/composables/usePortalConfig";
import PortalAuthStore from "~/portal/auth/PortalAuthStore.vue";
import { DATA_REF_ID, dataRef, resolveDataRef } from "~/portal/mock/data-refs";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { RESERVED_PILLAR_SEGMENT } from "~/portal/types";

// -----------------------------------------------------------------------------

const { signInBrand } = vi.hoisted(() => ({
  signInBrand: { name: "", hasUpmindBranding: false, footer: "" }
}));

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  const brand = reactive(signInBrand);
  return assign({}, actual, {
    useBrand: () => ({
      isReady: () => Promise.resolve(true),
      brandId: computed(() => "brand-1"),
      name: computed(() => brand.name),
      hasUpmindBranding: computed(() => brand.hasUpmindBranding)
    }),
    useClientTemplate: (params: { code: ClientTemplateSlotCodes }) => ({
      isReady: () => Promise.resolve(true),
      data: computed(() => {
        if (params.code !== ClientTemplateSlotCodes.FOOTER || !brand.footer)
          return undefined;
        return { body: brand.footer };
      })
    })
  });
});

const BRAND = '[data-test-key="portal-brand"]';

const NOTE = '[data-test-key="logged-out-note"]';

const STORE_KEY = "logged-out-store";

const STORE = `[data-test-key="${STORE_KEY}"]`;

const UPMIND_LINE = "Powered by Upmind";

const SIGN_IN_PATH = `/${RESERVED_PILLAR_SEGMENT.LOGIN}`;

const EXTERNAL_STOREFRONT = "https://store.hostgrid.example/order";

const AUTHORED_NAME = "Northwind Hosting";

const AUTHORED_FOOTER = "Northwind Hosting Ltd, somewhere in England.";

const AUTHORED_NOTE = "Read this before you sign in.";

const ROUTE_PROPS = {
  loginRoute: { name: "login" },
  registerRoute: { name: "register" },
  recoverRoute: { name: "recover" }
};

/** The markdown renderer paints after its own tick, as the DS's own tests wait. */
async function settle(): Promise<void> {
  await nextTick();
  await nextTick();
  await new Promise(resolve => {
    setTimeout(resolve, 100);
  });
}

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function stubRoute(path: string): void {
  stubMatchMedia();
  assign(globalThis, {
    useRoute: () => ({ path, query: {} }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), afterEach: vi.fn() }),
    navigateTo: vi.fn()
  });
}

/** Moves one template slot's body on the LIVE dataset, the way the brand would. */
function authorSlot(
  data: MockDataset,
  code: ClientTemplateSlotCodes,
  body: string
): void {
  const slot = find(data.templates, { code });
  if (isUndefined(slot)) throw new Error(`the seed carries no ${code} slot`);
  assign(slot, { body });
}

type Frame = {
  name: string;
  mountAt: (path: string, datasetId: string) => Promise<VueWrapper>;
  authorBrandName: (name: string) => void;
  authorFooter: (body: string) => void;
  allowPlatformLine: (allowed: boolean) => void;
};

const LAYOUT: Frame = {
  name: "the logged-out layout",
  mountAt: async (path, datasetId) => {
    stubRoute(path);
    usePortalConfig().setDataset(datasetId);
    const { default: layout } = await import("~/layouts/logged-out.vue");
    const wrapper = mount(layout, {
      slots: { default: () => h("p", "the screen") }
    });
    await settle();
    return wrapper;
  },
  authorBrandName: name => assign(hostgrid().brand, { name }),
  authorFooter: body =>
    authorSlot(hostgrid(), ClientTemplateSlotCodes.FOOTER, body),
  allowPlatformLine: allowed =>
    assign(hostgrid().features, { UPMIND_BRANDING_ENABLED: allowed })
};

const TEMPLATE: Frame = {
  name: "the sign-in pages' auth template",
  mountAt: async (path, datasetId) => {
    stubRoute(path);
    usePortalConfig().setDataset(datasetId);
    const { default: page } =
      await import("~/portal/auth/templates/AuthEnclosed.template.vue");
    const wrapper = mount(page, {
      props: ROUTE_PROPS,
      slots: { form: () => h("p", "the screen") }
    });
    await settle();
    return wrapper;
  },
  authorBrandName: name => assign(signInBrand, { name }),
  authorFooter: body => assign(signInBrand, { footer: body }),
  allowPlatformLine: allowed =>
    assign(signInBrand, { hasUpmindBranding: allowed })
};

/**
 * The store shortcut when it is an IN-APP link — a `NuxtLink`, as against the
 * plain anchor a brand's own storefront gets. Read as a component rather than
 * off `href`, because the router resolves that attribute and the stand-in
 * `#components` link does not.
 */
function storeLink(wrapper: VueWrapper): VueWrapper | undefined {
  return find(
    wrapper.findAllComponents(NuxtLink),
    candidate => candidate.attributes("data-test-key") === STORE_KEY
  );
}

function occurrences(text: string, of: string): number {
  return size(split(text, of)) - 1;
}

beforeEach(() => {
  assign(signInBrand, { name: "", hasUpmindBranding: false, footer: "" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetMockData(MOCK_DATASET_ID.HOSTGRID);
  resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  usePortalConfig().setDataset(MOCK_DATASET_ID.HOSTGRID);
  Reflect.deleteProperty(globalThis, "useRoute");
  Reflect.deleteProperty(globalThis, "useRouter");
  Reflect.deleteProperty(globalThis, "navigateTo");
});

describe.each([LAYOUT, TEMPLATE])("$name", frame => {
  describe("the brand's chrome, and nothing of the app's", () => {
    it("heads the screen with the brand's own wordmark, pointing back at sign-in", async () => {
      frame.authorBrandName(AUTHORED_NAME);

      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );
      const brand = wrapper.find(BRAND);

      expect(brand.exists()).toBe(true);
      expect(brand.text()).toContain(AUTHORED_NAME);
      expect(brand.attributes("href")).toBe(SIGN_IN_PATH);
    });

    it("gives the page one main landmark and no navigation at all", async () => {
      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );
      const items = resolveDataRef(
        dataRef(DATA_REF_ID.PILLAR_NAV_ITEMS),
        hostgrid()
      );
      const navItems = head(filter([items], isArray)) ?? [];
      const destinations = compact(map(navItems, "to"));
      const hrefs = map(wrapper.findAll("a"), link => link.attributes("href"));

      expect(wrapper.findAll("main")).toHaveLength(1);
      expect(wrapper.findAll("nav")).toHaveLength(0);
      expect(size(destinations)).toBeGreaterThan(1);
      for (const destination of destinations) {
        expect(hrefs, destination).not.toContain(destination);
      }
    });

    it("renders the screen's own body inside the shell", async () => {
      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );

      expect(wrapper.find("main").text()).toContain("the screen");
    });

    it("draws no note of its own", async () => {
      authorSlot(hostgrid(), ClientTemplateSlotCodes.LOGIN_PAGE, AUTHORED_NOTE);

      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );

      expect(wrapper.find(NOTE).exists()).toBe(false);
      expect(wrapper.text()).not.toContain(AUTHORED_NOTE);
    });
  });

  describe("the store shortcut", () => {
    it("draws the one store component both frames share", async () => {
      assign(hostgrid().features, { showStore: true });

      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );

      expect(wrapper.findAllComponents(PortalAuthStore)).toHaveLength(1);
    });

    it("links into the portal's own catalogue where the brand sells there", async () => {
      assign(hostgrid().features, {
        showStore: true,
        customStorefrontUrl: undefined
      });

      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );

      expect(size(wrapper.findAll(STORE))).toBe(1);
      expect(String(storeLink(wrapper)?.props("to")).startsWith("/")).toBe(
        true
      );
    });

    it("leaves the portal where the brand runs its own storefront", async () => {
      assign(hostgrid().features, {
        showStore: true,
        customStorefrontUrl: EXTERNAL_STOREFRONT
      });

      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );

      expect(wrapper.find(STORE).attributes("href")).toBe(EXTERNAL_STOREFRONT);
      expect(storeLink(wrapper)).toBeUndefined();
    });

    it("offers nothing to buy where the brand sells nothing here", async () => {
      assign(useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL).features, {
        showStore: false
      });

      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID_MINIMAL
      );

      expect(wrapper.find(STORE).exists()).toBe(false);
    });

    it("draws the store icon, not a bare glyph", async () => {
      assign(hostgrid().features, { showStore: true });

      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );
      const icon = wrapper.find(`${STORE} [role="img"]`);

      expect(icon.exists()).toBe(true);
      expect(icon.attributes("aria-label")).toBe("basket icon");
    });

    it("keeps its test key out of a production build", async () => {
      assign(hostgrid().features, { showStore: true });
      const testBuild = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );
      const label = testBuild.find(STORE).text();
      testBuild.unmount();
      vi.stubEnv("MODE", "production");

      const productionBuild = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );
      const shortcut = find(
        productionBuild.findAll("a"),
        link => link.text() === label
      );

      expect(label).not.toBe("");
      expect(shortcut?.exists()).toBe(true);
      expect(shortcut?.attributes("data-test-key")).toBeUndefined();
    });
  });

  describe("the footer", () => {
    // The gates read one shared reactive store, so a second shell re-renders the
    // first: the branded footer is READ before the unbranded one is mounted.
    it("names the platform only where the brand allows it to be named", async () => {
      frame.allowPlatformLine(true);
      const branded = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );
      const brandedFooter = branded.find("footer").text();
      branded.unmount();

      frame.allowPlatformLine(false);
      const unbranded = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );

      expect(brandedFooter).toContain(UPMIND_LINE);
      expect(unbranded.find("footer").text()).not.toContain(UPMIND_LINE);
    });

    it("prints the brand's own footer line, once", async () => {
      frame.authorFooter(AUTHORED_FOOTER);

      const wrapper = await frame.mountAt(
        SIGN_IN_PATH,
        MOCK_DATASET_ID.HOSTGRID
      );

      expect(occurrences(wrapper.find("footer").text(), AUTHORED_FOOTER)).toBe(
        1
      );
    });
  });
});

describe("the brand's note on the three templates that fill the markdown slot", () => {
  const MARKDOWN_TEMPLATES = [
    "AuthSplit",
    "AuthCanvasCard",
    "AuthSurfaceBox"
  ] as const;

  it.each(MARKDOWN_TEMPLATES)(
    "%s shows the note the page hands it once, beside no portal note",
    async name => {
      authorSlot(hostgrid(), ClientTemplateSlotCodes.LOGIN_PAGE, AUTHORED_NOTE);
      stubRoute(SIGN_IN_PATH);
      const { default: page } = await import(
        `~/portal/auth/templates/${name}.template.vue`
      );

      const wrapper = mount(page, {
        props: ROUTE_PROPS,
        slots: {
          markdown: () => h("div", AUTHORED_NOTE),
          form: () => h("p", "the screen")
        }
      });
      await settle();

      expect(occurrences(wrapper.text(), AUTHORED_NOTE)).toBe(1);
      expect(wrapper.find(NOTE).exists()).toBe(false);
    }
  );
});
