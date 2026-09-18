// -----------------------------------------------------------------------------
/**
 * @module tests/logged-out-shell
 * @description Plan F11: the shell the auth screens render in. None of the
 * signed-in chrome reaches it — no primary nav, no side rail — and everything
 * it DOES carry is the brand's own: its wordmark, its note for the screen, the
 * shortcut to its store, and the platform's line only where the brand lets it
 * show. Graded on the RENDERED layout rather than on the gates that feed it,
 * because a gate answering correctly into a slot nobody draws is not chrome.
 *
 * Every arm is differential against the gates-off dataset (plan R9), and the
 * brand's own copy is moved before it is read, so a note proven by the seed
 * that happens to carry one is not proven at all.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { ClientTemplateSlotCodes } from "@upmind-automation/types";
import { stubMatchMedia } from "./support/theme-harness";
import { assign, compact, find, map } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type { MockDataset } from "~/portal/mock/types";
import { NuxtLink } from "#components";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { DATA_REF_ID, dataRef, resolveDataRef } from "~/portal/mock/data-refs";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { RESERVED_PILLAR_SEGMENT } from "~/portal/types";

const BRAND = '[data-test-key="portal-brand"]';

const NOTE = '[data-test-key="logged-out-note"]';

const STORE_KEY = "logged-out-store";

const STORE = `[data-test-key="${STORE_KEY}"]`;

const UPMIND_LINE = "Powered by Upmind";

const SIGN_IN_PATH = `/${RESERVED_PILLAR_SEGMENT.LOGIN}`;

const EXTERNAL_STOREFRONT = "https://store.hostgrid.example/order";

/** The brand's own words, moved so the assertion cannot read the seed back. */
const AUTHORED_NOTE = "Read this before you sign in.";

/** The markdown renderer paints after its own tick, as the DS's own tests wait. */
async function settle(): Promise<void> {
  await nextTick();
  await nextTick();
  await new Promise(resolve => {
    setTimeout(resolve, 100);
  });
}

async function shellAt(path: string, datasetId: string): Promise<VueWrapper> {
  stubMatchMedia();
  Object.assign(globalThis, {
    useRoute: () => ({ path, query: {} }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), afterEach: vi.fn() }),
    navigateTo: vi.fn()
  });
  usePortalConfig().setDataset(datasetId);

  // The chrome moved into the COLUMNS when the pages took the cart's shape: the
  // cart gives its header and footer the body's own ground and no border, so a
  // bar would cut a two-column page in half. Every template composes the same
  // four parts, so any one of them proves the set.
  const { default: page } =
    await import("~/portal/auth/templates/AuthEnclosed.template.vue");
  const wrapper = mount(page, {
    // The organism hands every template the three routes it links between.
    props: {
      loginRoute: { name: "login" },
      registerRoute: { name: "register" },
      recoverRoute: { name: "recover" }
    },
    slots: { form: "<p>the screen</p>" }
  });
  await settle();
  return wrapper;
}

/**
 * The brand's note is BODY content, not chrome: the templates place it where
 * the cart places the organism's markdown slot, so it is proven where it lives.
 */
async function noteAt(path: string, datasetId: string): Promise<VueWrapper> {
  stubMatchMedia();
  Object.assign(globalThis, {
    useRoute: () => ({ path, query: {} }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), afterEach: vi.fn() }),
    navigateTo: vi.fn()
  });
  usePortalConfig().setDataset(datasetId);

  const { default: note } = await import("~/portal/auth/PortalAuthNote.vue");
  const wrapper = mount(note);
  await settle();
  return wrapper;
}

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

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

/** Moves one template slot's body on the LIVE dataset, the way the brand would. */
function authorSlot(
  data: MockDataset,
  code: ClientTemplateSlotCodes,
  body: string
): void {
  const slot = find(data.templates, { code });
  if (slot === undefined) throw new Error(`the seed carries no ${code} slot`);
  assign(slot, { body });
}

afterEach(() => {
  resetMockData(MOCK_DATASET_ID.HOSTGRID);
  resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  usePortalConfig().setDataset(MOCK_DATASET_ID.HOSTGRID);
  Reflect.deleteProperty(globalThis, "useRoute");
  Reflect.deleteProperty(globalThis, "useRouter");
  Reflect.deleteProperty(globalThis, "navigateTo");
});

describe("the logged-out shell — the brand's chrome, and nothing of the app's", () => {
  it("heads the screen with the brand's own wordmark, pointing back at sign-in", async () => {
    const wrapper = await shellAt(SIGN_IN_PATH, MOCK_DATASET_ID.HOSTGRID);
    const brand = wrapper.find(BRAND);

    expect(brand.exists()).toBe(true);
    expect(brand.text()).toContain(hostgrid().brand.name);
    expect(brand.attributes("href")).toBe(SIGN_IN_PATH);
  });

  it("gives the page one main landmark and no navigation at all", async () => {
    const wrapper = await shellAt(SIGN_IN_PATH, MOCK_DATASET_ID.HOSTGRID);
    const items = resolveDataRef(
      dataRef(DATA_REF_ID.PILLAR_NAV_ITEMS),
      hostgrid()
    );
    const destinations = compact(map(Array.isArray(items) ? items : [], "to"));
    const hrefs = map(wrapper.findAll("a"), link => link.attributes("href"));

    expect(wrapper.findAll("main")).toHaveLength(1);
    expect(wrapper.findAll("nav")).toHaveLength(0);
    expect(destinations.length).toBeGreaterThan(1);
    for (const destination of destinations) {
      expect(hrefs, destination).not.toContain(destination);
    }
  });

  it("renders the screen's own body inside the shell", async () => {
    const wrapper = await shellAt(SIGN_IN_PATH, MOCK_DATASET_ID.HOSTGRID);

    expect(wrapper.find("main").text()).toContain("the screen");
  });
});

describe("the brand's note for the screen it is on", () => {
  it("prints the login slot on the sign-in screen", async () => {
    authorSlot(hostgrid(), ClientTemplateSlotCodes.LOGIN_PAGE, AUTHORED_NOTE);

    const wrapper = await noteAt(SIGN_IN_PATH, MOCK_DATASET_ID.HOSTGRID);

    expect(wrapper.find(NOTE).text()).toBe(AUTHORED_NOTE);
  });

  it("prints the register slot on the register screen, not the login one", async () => {
    const data = hostgrid();
    authorSlot(data, ClientTemplateSlotCodes.LOGIN_PAGE, AUTHORED_NOTE);
    authorSlot(
      data,
      ClientTemplateSlotCodes.REGISTER_PAGE,
      "Read this before you open one."
    );

    const wrapper = await noteAt(
      `/${RESERVED_PILLAR_SEGMENT.REGISTER}`,
      MOCK_DATASET_ID.HOSTGRID
    );

    expect(wrapper.find(NOTE).text()).toBe("Read this before you open one.");
  });

  it("prints nothing on a screen the brand wrote no note for", async () => {
    const wrapper = await noteAt(
      `/${RESERVED_PILLAR_SEGMENT.VERIFY}`,
      MOCK_DATASET_ID.HOSTGRID
    );

    expect(wrapper.find(NOTE).exists()).toBe(false);
  });

  it("prints nothing for a brand that wrote no note at all", async () => {
    const wrapper = await noteAt(
      SIGN_IN_PATH,
      MOCK_DATASET_ID.HOSTGRID_MINIMAL
    );

    expect(wrapper.find(NOTE).exists()).toBe(false);
  });
});

describe("the store shortcut, and the platform's own line", () => {
  it("links into the portal's own catalogue where the brand sells there", async () => {
    const wrapper = await shellAt(SIGN_IN_PATH, MOCK_DATASET_ID.HOSTGRID);

    expect(hostgrid().features.showStore).toBe(true);
    expect(hostgrid().features.customStorefrontUrl).toBeUndefined();
    expect(wrapper.find(STORE).exists()).toBe(true);
    expect(String(storeLink(wrapper)?.props("to")).startsWith("/")).toBe(true);
  });

  it("leaves the portal where the brand runs its own storefront", async () => {
    assign(hostgrid().features, { customStorefrontUrl: EXTERNAL_STOREFRONT });

    const wrapper = await shellAt(SIGN_IN_PATH, MOCK_DATASET_ID.HOSTGRID);

    expect(wrapper.find(STORE).attributes("href")).toBe(EXTERNAL_STOREFRONT);
    expect(storeLink(wrapper)).toBeUndefined();
  });

  it("offers nothing to buy where the brand sells nothing here", async () => {
    const wrapper = await shellAt(
      SIGN_IN_PATH,
      MOCK_DATASET_ID.HOSTGRID_MINIMAL
    );

    expect(
      useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL).features.showStore
    ).toBe(false);
    expect(wrapper.find(STORE).exists()).toBe(false);
  });

  // The gates read one shared reactive store, so a second shell re-renders the
  // first: the branded footer is READ before the unbranded one is mounted.
  it("names the platform only where the brand allows it to be named", async () => {
    const branded = await shellAt(SIGN_IN_PATH, MOCK_DATASET_ID.HOSTGRID);
    const brandedFooter = branded.find("footer").text();
    branded.unmount();

    const unbranded = await shellAt(
      SIGN_IN_PATH,
      MOCK_DATASET_ID.HOSTGRID_MINIMAL
    );

    expect(hostgrid().features.UPMIND_BRANDING_ENABLED).toBe(true);
    expect(brandedFooter).toContain(UPMIND_LINE);
    expect(unbranded.find("footer").text()).not.toContain(UPMIND_LINE);
  });

  it("prints the brand's own footer line whichever way that gate falls", async () => {
    authorSlot(
      hostgrid(),
      ClientTemplateSlotCodes.FOOTER,
      "Host Grid Ltd, somewhere in England."
    );

    const wrapper = await shellAt(SIGN_IN_PATH, MOCK_DATASET_ID.HOSTGRID);

    expect(wrapper.find("footer").text()).toContain(
      "Host Grid Ltd, somewhere in England."
    );
  });
});
