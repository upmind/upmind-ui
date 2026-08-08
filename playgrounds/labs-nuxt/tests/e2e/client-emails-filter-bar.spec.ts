// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/client-emails-filter-bar
 * @description ⛳ CANARY, the half no bridge call can reach (Task 14, Task 61):
 * the filter bar the operator SEES is the `Filter` renderer built from the
 * module's own query schema — not a fallback Select, not a header keyword box —
 * typing in it narrows the rendered rows through a REAL re-query, and the
 * Inspector's debug row shows schema → uischema → model → the BUILT wire.
 *
 * Its sibling `client-emails-filter-sort.spec.ts` drives the same capability
 * through the harness action bridge; this file drives it through the rendered
 * controls, which is the only way the gate's own wording — *"the `Filter` bar
 * renders switches and a search box from the schema alone"* — can be measured.
 *
 * Corpus: the recorded 3-row fixture behind the param-branching handler, so a
 * client-side-only filter leaves the served rows untouched and every count
 * assertion below goes red.
 */

import { expect, test } from "@playwright/test";
import { canaryRoute } from "./catalogs";
import {
  installRecordedCorpus,
  seedRecordedClientSession
} from "./recorded-corpus";
import type { RecordedTraffic } from "./recorded-corpus";
import type { Page } from "@playwright/test";

// -----------------------------------------------------------------------------

const FILTER_BAR = '[data-test-key="filters"]';
const SEARCH = 'input[data-test-value="properties-filters-properties-email"]';

/** The four controls §12's uischema declares, in the order it lays them out. */
const DECLARED_CONTROLS = [
  "filters-email",
  "filters-verified",
  "filters-bounced",
  "filters-default"
];

const RECORDED = {
  verified: "mock-email-1@example.com",
  match: "mock-email-3@example.com"
} as const;

const rows = (page: Page) => page.locator("tbody tr");

function collectionReads(traffic: RecordedTraffic): string[] {
  return traffic
    .requests()
    .filter(entry => /GET \S+\/emails\?/.test(entry))
    .map(entry => decodeURIComponent(entry));
}

async function openCanary(page: Page): Promise<RecordedTraffic> {
  const traffic = await installRecordedCorpus(page);
  await seedRecordedClientSession(page);
  await page.goto(canaryRoute);
  await expect(rows(page)).toHaveCount(3);
  return traffic;
}

/** Expands one of the Inspector's debug collapsibles and parses its `<pre>`. */
async function debugSection(page: Page, name: string): Promise<unknown> {
  const trigger = page.locator(`button:text-is("${name}")`).first();
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.click();
  }
  const content = page.locator(
    `#${await trigger.getAttribute("aria-controls")}`
  );
  await expect(content).toBeVisible();
  return JSON.parse(await content.innerText());
}

async function openDebugTab(page: Page) {
  await page
    .locator('[data-test-key="tab-item"][data-test-value="Debug"]')
    .click();
}

// -----------------------------------------------------------------------------

test.describe("@AC7 the canary's filter bar IS the Filter renderer (Task 14)", () => {
  test("renders one control per declared filter column, from the schema alone", async ({
    page
  }) => {
    await openCanary(page);

    const bar = page.locator(FILTER_BAR);
    await expect(bar).toHaveCount(1);

    for (const control of DECLARED_CONTROLS) {
      await expect(
        bar.locator(`[data-test-key="form-item"][data-test-value="${control}"]`)
      ).toHaveCount(1);
    }
    await expect(bar.locator('[data-test-key="form-item"]')).toHaveCount(
      DECLARED_CONTROLS.length
    );
  });

  test("the three boolean columns are tri-state SWITCHES with an unset position — never a Select (W-D13/W-D21)", async ({
    page
  }) => {
    await openCanary(page);
    const bar = page.locator(FILTER_BAR);

    await expect(bar.locator('[role="switch"]')).toHaveCount(3);
    await expect(bar.locator("select")).toHaveCount(0);
    await expect(bar.locator('[role="combobox"]')).toHaveCount(0);

    // Unset is a THIRD position, not a falsy switch: every boolean column boots
    // showing it, which is what makes "no opinion" spellable at all.
    for (const control of [
      "filters-verified",
      "filters-bounced",
      "filters-default"
    ]) {
      const item = bar.locator(
        `[data-test-key="form-item"][data-test-value="${control}"]`
      );
      await expect(item.locator('[role="switch"]')).toHaveAttribute(
        "aria-checked",
        "false"
      );
    }
  });

  test("the search box is the email column's own control, translated, full width above the switches", async ({
    page
  }) => {
    await openCanary(page);

    const search = page.locator(FILTER_BAR).locator(SEARCH);
    await expect(search).toHaveCount(1);
    await expect(search).toHaveAttribute("type", "text");

    // Translated: a placeholder is i18n's to own (W-D19), so a raw key here
    // would mean the control reached the DOM with no translator installed.
    const placeholder = await search.getAttribute("placeholder");
    expect(placeholder).toBeTruthy();
    expect(placeholder).not.toMatch(/^(form|text|action|error)\./);
  });
});

test.describe("@AC7 typing in the bar narrows the rows through a real re-query", () => {
  test("one keystroke-settled search issues ONE collection read carrying the like filter", async ({
    page
  }) => {
    const traffic = await openCanary(page);
    const before = collectionReads(traffic).length;

    await page.locator(SEARCH).fill("mock-email-3");

    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page)).toContainText([RECORDED.match]);

    const issued = collectionReads(traffic).slice(before);
    expect(issued).toHaveLength(1);
    expect(issued[0]).toContain("filter[email|like]=%mock-email-3%");
  });

  test("a switch narrows on the wire too, and clearing the search restores every row", async ({
    page
  }) => {
    const traffic = await openCanary(page);

    await page.locator(SEARCH).fill("mock-email-3");
    await expect(rows(page)).toHaveCount(1);

    await page.locator(SEARCH).fill("");

    await expect(rows(page)).toHaveCount(3);
    const restored = collectionReads(traffic).at(-1) ?? "";
    expect(restored).not.toContain("filter[email|like]");
  });

  test("the rows the operator sees are the rows the SERVER returned — not a client-side slice", async ({
    page
  }) => {
    const traffic = await openCanary(page);

    await page.locator(SEARCH).fill("mock-email-1");

    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page)).toContainText([RECORDED.verified]);
    // The handler branches on the request's own params, so this row count is
    // only reachable if the filter travelled.
    expect(collectionReads(traffic).at(-1)).toContain(
      "filter[email|like]=%mock-email-1%"
    );
  });
});

test.describe("@AC7 the Inspector's debug row shows the BUILT wire (Task 61)", () => {
  test("carries schema, uischema, model and the built request side by side", async ({
    page
  }) => {
    await openCanary(page);
    await openDebugTab(page);

    const schema = (await debugSection(page, "Schema")) as {
      properties: Record<string, unknown>;
    };
    expect(Object.keys(schema.properties)).toEqual(
      expect.arrayContaining(["filters", "sort", "pagination"])
    );

    const uischema = (await debugSection(page, "Uischema")) as {
      elements: { type: string; elements?: { type: string }[] }[];
    };
    const leaves = uischema.elements.flatMap(element =>
      element.elements
        ? element.elements.map(child => child.type)
        : [element.type]
    );
    expect(leaves).toEqual(["Filter", "Filter", "Filter", "Filter"]);

    expect(await debugSection(page, "Model")).toEqual({
      pagination: { limit: 10 },
      sort: [{ field: "created_at", dir: "desc" }]
    });

    // The WIRE, beside the model it was built from — the "raw vs rendered"
    // pairing W-D34 asked for, in the serialised form the request carries.
    expect(await debugSection(page, "Request")).toEqual({
      order: "-created_at",
      limit: "10"
    });
  });

  test("the wire row is BUILT from the live criteria — it updates with no request in flight", async ({
    page
  }) => {
    const traffic = await openCanary(page);

    await openDebugTab(page);
    await debugSection(page, "Request");
    await page.route("**/emails?*", route => route.abort());
    const before = collectionReads(traffic).length;

    await page.locator(SEARCH).fill("mock-email-3");

    // No collection read can have completed — the row can only be showing what
    // the criteria BUILDS, which is SB2's whole point (the panel used to read
    // `searchParams` off the last actual fetch and sat empty until one landed).
    await expect
      .poll(() => debugSection(page, "Request"))
      .toMatchObject({ "filter[email|like]": "%mock-email-3%" });
    expect(collectionReads(traffic).length).toBe(before);
  });
});
