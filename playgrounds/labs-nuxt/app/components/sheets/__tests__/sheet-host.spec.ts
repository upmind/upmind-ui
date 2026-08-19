// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module sheets/__tests__/sheet-host.spec
 * @description T3.2 — the ONE host over the page (`AC3.1` · `AC3.2` · `P1-R5` ·
 * `P1-R14` · `S5`). Four claims:
 *   1. ONE sheet is on screen whichever pane is open, and it is the ui
 *      component's own — the `Sheet.ce.vue` / `Tabs.ce.vue` hooks, never markup
 *      imitating them;
 *   2. opening it leaves the page at FULL WIDTH: nothing outside the host — the
 *      document, the body, the page itself — changes a class, a style or its
 *      liveness, which is also what a MODAL sheet would break, since locking the
 *      page pads the body by the scrollbar it just removed (`AC3.1`, the `pr-96`
 *      that is long gone);
 *   3. the tab strip is the REGISTRY drawn: a page's own section goes the moment
 *      that page unmounts, while the layout's persistent section stays — which
 *      is what makes Debug page-scoped (`AC3.2` · `P1-R12`);
 *   4. `sheet=` / `tab=` on the url decide what is open, so a pasted link opens
 *      the pane and the section it names (`S11`).
 *
 * The registry's own semantics are `playground-sheet.spec.ts`'s; what is read
 * here is only what the host DRAWS from them. Everything is read off the
 * document rather than the component tree because the sheet is portalled out of
 * the host, exactly as it is in the app. A boot is `vi.resetModules()` plus a
 * fresh import over the url the case names, because the open state and the
 * registry are module-scope singletons that would otherwise answer the next case
 * from the last one's state.
 */

import { config, mount } from "@vue/test-utils";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { defineComponent, h, nextTick } from "vue";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import layoutSource from "../../../layouts/default.vue?raw";
import { PlaygroundSheetTypes } from "../usePlaygroundSheet.types";
import {
  filter,
  first,
  flatMap,
  forEach,
  get,
  last,
  map,
  some,
  trim
} from "lodash-es";
import type { PlaygroundSheetState } from "../usePlaygroundSheet.types";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const BOOT_PATH = "/useClientEmails/";

const PAGE_SECTION = "client-emails";

const LAYOUT_SECTION = "useAuth-session";

let mounted: VueWrapper[] = [];

type Booted = { sheet: PlaygroundSheetState; SheetHost: Component };

/**
 * The playground's own namespace, merged into the catalogue the component lane
 * already installs — a second `createI18n` would install a second copy of
 * vue-i18n's components over the same app.
 */
function installLabsCatalogue(): void {
  forEach(config.global.plugins, plugin => {
    const catalogue = get(plugin, ["global"]) as
      | { mergeLocaleMessage?: (locale: string, messages: object) => void }
      | undefined;
    catalogue?.mergeLocaleMessage?.("en", { labs: labsEn });
  });
}

async function boot(query = ""): Promise<Booted> {
  window.history.replaceState({}, "", `${BOOT_PATH}${query}`);
  vi.resetModules();
  installLabsCatalogue();

  return {
    sheet: (await import("../usePlaygroundSheet")).usePlaygroundSheet(),
    SheetHost: (await import("../SheetHost.vue")).default
  };
}

/** What a page hands the host — the section shape the Debug pane already draws. */
const sectionFor = (key: string) => ({
  key,
  factory: () => ({ name: key, state: "ready", meta: { isLoading: false } })
});

/** A page that registers its section in its own `setup`, and can leave again. */
function page(
  sheet: PlaygroundSheetState,
  key: string,
  persistent?: boolean
): VueWrapper {
  const wrapper = mount(
    defineComponent({
      setup() {
        sheet.register(sectionFor(key), persistent);
        return () => h("div");
      }
    })
  );
  mounted.push(wrapper);

  return wrapper;
}

/**
 * The host as the layout mounts it: beside the page, never around it. The page
 * stand-in is what claim 2 measures — if anything ever compensated for the
 * sheet's width, this is the element that would be pushed.
 */
function mountHost(SheetHost: Component): VueWrapper {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h("div", [
          h("main", { class: "page", "data-test-key": "page" }, "the page"),
          h(SheetHost)
        ])
    }),
    { attachTo: document.body }
  );
  mounted.push(wrapper);

  return wrapper;
}

const nodesWith = (key: string): HTMLElement[] =>
  Array.from(document.querySelectorAll(`[data-test-key='${key}']`));

/** The sheet on screen — portalled to the document, as it is in the app. */
const sheetsOnScreen = () => nodesWith("sheet-content");

/** Which pane the one host is showing. */
const openPane = () =>
  map(nodesWith("sheet-host"), node => node.dataset.testValue);

/** The Debug tab strip, as `name:state` pairs in render order. */
const tabs = () =>
  map(
    nodesWith("tab-item"),
    tab => `${tab.dataset.testValue}:${tab.dataset.state}`
  );

/**
 * Everything outside the host that could take width from the page or take it
 * out of the user's reach: a modal sheet locks the body's scroll and pads it by
 * the scrollbar width, which is the very compensation `AC3.1` forbids.
 */
const pageGeometry = (wrapper: VueWrapper) => {
  const page = wrapper.find('[data-test-key="page"]').element;

  return {
    documentClass: document.documentElement.className,
    documentStyle: document.documentElement.getAttribute("style"),
    bodyClass: document.body.className,
    bodyStyle: document.body.getAttribute("style"),
    pageClass: page.className,
    pageStyle: page.getAttribute("style"),
    pageHidden: page.getAttribute("aria-hidden"),
    pageInert: page.hasAttribute("inert")
  };
};

/**
 * Every treatment the LAYOUT — the host's own mount site, and the only place
 * with both the sheet and the page in hand — puts on the page: class tokens and
 * style declarations, bound or static, down to the literals a bound expression
 * spells, since `:class="[open ? 'pr-96' : '']"` is the compensation as surely
 * as `class="pr-96"` is.
 */
const layoutTreatments = (): string[] =>
  flatMap([...layoutSource.matchAll(/:?(?:class|style)="([^"]*)"/g)], match =>
    filter(match[1].split(/[\s;'"[\],]+/), Boolean)
  );

/** The expressions the layout BINDS a class or a style to. */
const layoutBindings = (): string[] =>
  map(
    [...layoutSource.matchAll(/:(?:class|style)="([^"]*)"/g)],
    match => match[1]
  );

/** What the layout took off the sheet host — the state a reflow would read. */
const sheetReads = (): string[] =>
  flatMap(
    [...layoutSource.matchAll(/\{([^}]*)\}\s*=\s*usePlaygroundSheet\(\)/g)],
    match =>
      filter(
        map(match[1].split(","), member => trim(last(member.split(":")))),
        Boolean
      )
  );

/**
 * Right-hand padding, margin or offset, or a width computed off the viewport:
 * room made for a panel. A `calc` on a HEIGHT is none of that, so the width
 * alternative names the two units a full-width column is taken out of.
 */
const COMPENSATION =
  /(?:^|:)(?:p[rxe]-|m[rxe]-|right-|inset-)|padding-right|margin-right|calc\([^)]*(?:100%|100vw)/;

const settle = async () => {
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * The ui `Sheet`/`Tabs` graph's first resolve+transform costs ~4.3 s of the 5 s
 * per-case budget, so whichever case booted first reddened under the full
 * suite's parallel load. Paid once here — a case's own `boot()` re-executes an
 * already-transformed graph in ~0.2 s — so every case measures its own work.
 */
beforeAll(async () => {
  const { SheetHost } = await boot();
  mountHost(SheetHost).unmount();
  document.body.innerHTML = "";
}, 30000);

beforeEach(() => {
  localStorage.clear();
  mounted = [];
});

afterEach(() => {
  for (const wrapper of mounted) wrapper.unmount();
  mounted = [];
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("T3.2 ONE sheet, and it is the ui component's own (P1-R14 · S5)", () => {
  it("puts exactly one sheet on screen, drawn from the ui sheet and its tab strip", async () => {
    const { sheet, SheetHost } = await boot();
    mountHost(SheetHost);
    page(sheet, PAGE_SECTION);
    sheet.open(PlaygroundSheetTypes.DEBUG);
    await settle();

    expect(sheetsOnScreen()).toHaveLength(1);
    expect(nodesWith("sheet-title")).toHaveLength(1);
    expect(tabs()).toEqual([`${PAGE_SECTION}:active`]);
  });

  it("switches pane inside that same sheet — a switch is not a second host", async () => {
    const { sheet, SheetHost } = await boot();
    mountHost(SheetHost);
    page(sheet, PAGE_SECTION);
    sheet.open(PlaygroundSheetTypes.DEBUG);
    await settle();

    sheet.open(PlaygroundSheetTypes.CODE);
    await settle();

    expect(sheetsOnScreen()).toHaveLength(1);
    expect(openPane()).toEqual([PlaygroundSheetTypes.CODE]);
  });

  it("leaves no sheet behind when it is closed", async () => {
    const { sheet, SheetHost } = await boot();
    mountHost(SheetHost);
    page(sheet, PAGE_SECTION);
    sheet.open(PlaygroundSheetTypes.DEBUG);
    await settle();

    sheet.close();
    await settle();

    expect(sheetsOnScreen()).toEqual([]);
    expect(openPane()).toEqual([]);
  });
});

describe("T3.2 the page keeps its full width, open or closed (AC3.1 · P1-R5)", () => {
  // 15s: the first boot() in a cold combined run pays the sheets module-graph
  // transform; the default 5s budget was flake, not signal.
  it(
    "changes nothing outside the host when a sheet opens",
    { timeout: 15000 },
    async () => {
      const { sheet, SheetHost } = await boot();
      const host = mountHost(SheetHost);
      page(sheet, PAGE_SECTION);
      await settle();
      const closed = pageGeometry(host);

      sheet.open(PlaygroundSheetTypes.DEBUG);
      await settle();

      expect(sheetsOnScreen()).toHaveLength(1);
      expect(pageGeometry(host)).toEqual(closed);
    }
  );

  it("keeps the page live underneath — it is over the page, not instead of it", async () => {
    const { sheet, SheetHost } = await boot();
    const host = mountHost(SheetHost);
    page(sheet, PAGE_SECTION);
    sheet.open(PlaygroundSheetTypes.DEBUG);
    await settle();
    const geometry = pageGeometry(host);

    expect(geometry.pageHidden).toBeNull();
    expect(geometry.pageInert).toBe(false);
    expect(first(sheetsOnScreen())!.contains(host.find("main").element)).toBe(
      false
    );
  });

  it("reserves no room for the sheet in the layout that mounts it", () => {
    expect(
      filter(layoutTreatments(), token => COMPENSATION.test(token))
    ).toEqual([]);
  });

  it("binds no layout treatment to whether a sheet is open — nothing reflows", () => {
    const reads = [...sheetReads(), "sheet"];

    expect(
      filter(layoutBindings(), expression =>
        some(reads, name => new RegExp(`\\b${name}\\b`, "i").test(expression))
      )
    ).toEqual([]);
  });

  it("hands the same treatment back when it closes again", async () => {
    const { sheet, SheetHost } = await boot();
    const host = mountHost(SheetHost);
    page(sheet, PAGE_SECTION);
    sheet.open(PlaygroundSheetTypes.DEBUG);
    await settle();
    const open = pageGeometry(host);

    sheet.close();
    await settle();

    expect(open).toEqual(pageGeometry(host));
  });
});

describe("T3.2 the tab strip is the page's own registry, drawn (AC3.2 · P1-R12)", () => {
  it("draws one tab per registered section, the layout's beside the page's", async () => {
    const { sheet, SheetHost } = await boot();
    mountHost(SheetHost);
    page(sheet, LAYOUT_SECTION, true);
    page(sheet, PAGE_SECTION);
    sheet.open(PlaygroundSheetTypes.DEBUG);
    await settle();

    expect(tabs()).toEqual([
      `${LAYOUT_SECTION}:active`,
      `${PAGE_SECTION}:inactive`
    ]);
  });

  it("drops the page's tab when that page leaves, and keeps the layout's", async () => {
    const { sheet, SheetHost } = await boot();
    mountHost(SheetHost);
    page(sheet, LAYOUT_SECTION, true);
    const client = page(sheet, PAGE_SECTION);
    sheet.open(PlaygroundSheetTypes.DEBUG);
    await settle();

    client.unmount();
    await settle();

    expect(tabs()).toEqual([`${LAYOUT_SECTION}:active`]);
    expect(sheetsOnScreen()).toHaveLength(1);
  });
});

describe("T3.2 a pasted link opens what it names (AC3.1 · S11)", () => {
  it("opens the pane the url names", async () => {
    const { sheet, SheetHost } = await boot("?sheet=code");
    mountHost(SheetHost);
    page(sheet, PAGE_SECTION);
    await settle();

    expect(openPane()).toEqual([PlaygroundSheetTypes.CODE]);
    expect(sheetsOnScreen()).toHaveLength(1);
  });

  it("opens it on the section the url names, not merely the first one", async () => {
    const { sheet, SheetHost } = await boot(`?sheet=debug&tab=${PAGE_SECTION}`);
    mountHost(SheetHost);
    page(sheet, LAYOUT_SECTION, true);
    page(sheet, PAGE_SECTION);
    await settle();

    expect(tabs()).toEqual([
      `${LAYOUT_SECTION}:inactive`,
      `${PAGE_SECTION}:active`
    ]);
  });

  it("opens no sheet at all on a page with nothing registered (P1-R4)", async () => {
    const { SheetHost } = await boot("?sheet=debug");
    mountHost(SheetHost);
    await settle();

    expect(sheetsOnScreen()).toEqual([]);
  });
});
