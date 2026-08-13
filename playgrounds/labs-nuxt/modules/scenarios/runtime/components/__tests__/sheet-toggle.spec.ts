// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/sheet-toggle.spec
 * @description T4.7 — Debug │ Code │ Scenario, inside the bar (`G14 refined` ·
 * `G1` · `AC3.1` · `S11` · `S22`). Three claims:
 *   1. exactly three entries, drawn as ONE ui `ButtonGroup` — Preview is dead
 *      and Code sits beside the other two, never a fourth entry and never a
 *      bar of its own;
 *   2. choosing one writes `sheet=` through the ONE url writer, leaving every
 *      surface param it does not own exactly where it was;
 *   3. the open sheet IS the marked entry — the url is the state, so a pasted
 *      link opens with that entry marked and nothing else.
 *
 * Both the url writer's bag and the sheet registry are module-scope singletons,
 * so every case re-imports the component over the url it is about to read (the
 * `playground-sheet.spec` precedent) and registers a section — `hasSections` is
 * the toggle's own gate, and a page with none offers no toggle at all.
 *
 * ## What breaks if these fail
 * A toggle that opens a sheet nobody can be sent to, or one that rewrites the
 * query and drops the track a colleague was linked to.
 */

import { mount } from "@vue/test-utils";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "../../../../../app/assets/locales/en/labs.json";
import { filter, fromPairs, get, includes, map, nth, size } from "lodash-es";

// -----------------------------------------------------------------------------

const PAGE = "/useClientEmails/";

const PAGE_SECTION = "client-emails";

const SHEETS = ["debug", "code", "scenario"];

const SHEET_LABELS = [
  get(labsEn, "sheet_debug"),
  get(labsEn, "sheet_code"),
  get(labsEn, "sheet_scenario")
];

const messages = { en: { action, labs: labsEn, text } };

const search = () => new URLSearchParams(window.location.search);

const settle = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 50));

/**
 * A booted toggle over a page that has registered a section. The ui group is
 * resolved from the SAME fresh graph the component imported, so the component
 * lookup names the very component under the toggle rather than a second copy.
 */
async function mountToggle(query = "") {
  window.history.replaceState({}, "", `${PAGE}${query}`);
  vi.resetModules();
  const { usePlaygroundSheet } =
    await import("../../../../../app/components/sheets/usePlaygroundSheet");
  const { ButtonGroup } = await import("@upmind-automation/upmind-ui");
  const SheetToggle = (await import("../SheetToggle.vue")).default;

  usePlaygroundSheet().add({
    key: PAGE_SECTION,
    factory: () => ({ name: PAGE_SECTION })
  });

  const wrapper = mount(SheetToggle, {
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale: "en", messages })]
    }
  });
  await settle();

  return { wrapper, group: wrapper.findComponent(ButtonGroup) };
}

type Toggle = Awaited<ReturnType<typeof mountToggle>>;

const entries = ({ wrapper }: Toggle) =>
  wrapper.findAll('[data-test-key="sheet"]');

const marked = (toggle: Toggle) =>
  map(entries(toggle), entry => entry.attributes("aria-pressed") === "true");

/**
 * The ui package's first resolve+transform costs ~3.3 s of the 5 s per-case
 * budget, so whichever case mounted first reddened under the full suite's
 * parallel load. Paid once here — a later `mountToggle()` re-executes an
 * already-transformed graph in ~0.2 s — so every case measures its own work.
 */
beforeAll(async () => {
  const { wrapper } = await mountToggle();
  wrapper.unmount();
  document.body.innerHTML = "";
}, 30000);

beforeEach(() => {
  window.history.replaceState({}, "", PAGE);
  // A first-ever visit: no url, and no open preference a previous case left
  // behind. No key is named — the composable's own `open`/`close` is the only
  // writer there is.
  localStorage.clear();
});

afterEach(() => {
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("T4.7 one group of exactly three entries (G14 refined · S22)", () => {
  it("draws the real ui ButtonGroup, once", async () => {
    const toggle = await mountToggle();

    expect(toggle.group.exists()).toBe(true);
    expect(size(toggle.wrapper.findAll('[data-test-key="sheet-toggle"]'))).toBe(
      1
    );
  });

  it("offers Debug, Code and Scenario — and nothing else", async () => {
    const toggle = await mountToggle();

    expect(size(toggle.group.props("items"))).toBe(3);
    expect(
      map(entries(toggle), entry => entry.attributes("data-test-value"))
    ).toStrictEqual(SHEETS);
  });

  it("names them in the catalogue's own words, never a raw key (S21)", async () => {
    const toggle = await mountToggle();

    expect(map(entries(toggle), entry => entry.text())).toStrictEqual(
      SHEET_LABELS
    );
    expect(includes(toggle.wrapper.html(), "labs.")).toBe(false);
  });
});

describe("T4.7 choosing an entry writes sheet= through the one writer (S11 · AC3.1)", () => {
  it("puts the chosen sheet in the url", async () => {
    const toggle = await mountToggle();

    await nth(entries(toggle), 1)?.trigger("click");
    await settle();

    expect(search().get("sheet")).toBe("code");
  });

  it("leaves the surface params it does not own exactly where they were", async () => {
    const toggle = await mountToggle("?view=table&track=filtering-narrows");

    await nth(entries(toggle), 2)?.trigger("click");
    await settle();

    expect(fromPairs([...search().entries()])).toStrictEqual({
      view: "table",
      track: "filtering-narrows",
      sheet: "scenario"
    });
  });
});

describe("T4.7 the open sheet is the marked entry (S11)", () => {
  it("marks the entry the url names, and only it", async () => {
    const toggle = await mountToggle("?sheet=scenario");

    expect(marked(toggle)).toStrictEqual([false, false, true]);
  });

  it("marks nothing at all where no sheet is open", async () => {
    const toggle = await mountToggle();

    expect(filter(marked(toggle))).toStrictEqual([]);
  });

  it("moves the mark to the entry that was chosen", async () => {
    const toggle = await mountToggle("?sheet=debug");

    await nth(entries(toggle), 1)?.trigger("click");
    await settle();

    expect(marked(toggle)).toStrictEqual([false, true, false]);
  });
});
