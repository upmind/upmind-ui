// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/client-emails-filter-bar
 * @description ⛳ CANARY, the half no bridge call can reach (Task 14, P1-R12):
 * the filter bar the operator SEES is the `Filter` renderer built from the
 * module's own query schema — not a fallback Select, not a header keyword box —
 * typing in it narrows the rendered rows through a REAL re-query, and the
 * Inspector carries the page's OWN tab and no deleted Debug one.
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

/** The three controls §12's uischema declares, in the order it lays them out. */
const DECLARED_CONTROLS = [
  "filters-email",
  "filters-verified",
  "filters-bounced"
];

/** The two P1-R3 treatments, each by the test key its own control carries. */
const BUTTON_POSITION = '[data-test-key="button"]';
const TOGGLE_POSITION = '[data-test-key="toggle-group-item"]';
const UNSET_POSITION = '[data-test-value="all"]';
const YES_POSITION = '[data-test-value="yes"]';

const columnIn = (page: Page, name: string) =>
  page
    .locator(FILTER_BAR)
    .locator(`[data-test-key="form-item"][data-test-value="filters-${name}"]`);

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

/** The canary's own `nav.i18n`, resolved — the label its declaration chose. */
const CANARY_TAB = "Emails";

const tab = (page: Page, name: string) =>
  page.locator(`[data-test-key="tab-item"][data-test-value="${name}"]`);

/** The Inspector boots closed (P1-R4), so its own trigger opens it first. */
async function openInspector(page: Page) {
  await page
    .locator('[data-test-key="button"][data-test-value="inspect"]')
    .click();
  await expect(tab(page, "Session (Scoped)")).toHaveCount(1);
}

/** Navigates through the app's OWN router, so the page unmounts as it does live. */
async function leaveCanary(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const nuxt = (
      window as unknown as {
        useNuxtApp: () => { $router: { push: (to: string) => Promise<void> } };
      }
    ).useNuxtApp();
    await nuxt.$router.push("/");
  });
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
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

  test("the two boolean columns draw the treatment their uischema names — never a switch, never a Select (P1-R3/W-D21)", async ({
    page
  }) => {
    await openCanary(page);
    const bar = page.locator(FILTER_BAR);

    await expect(
      columnIn(page, "verified").locator(BUTTON_POSITION)
    ).toHaveCount(3);
    await expect(
      columnIn(page, "bounced").locator(TOGGLE_POSITION)
    ).toHaveCount(2);
    await expect(bar.locator('[role="switch"]')).toHaveCount(0);
    await expect(bar.locator("select")).toHaveCount(0);
    await expect(bar.locator('[role="combobox"]')).toHaveCount(0);
  });

  test("both treatments boot unset — the labelled one standing on All, the label-less one on nothing", async ({
    page
  }) => {
    await openCanary(page);

    await expect(
      columnIn(page, "verified").locator(UNSET_POSITION)
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      columnIn(page, "bounced").locator(
        `${TOGGLE_POSITION}[aria-pressed="true"]`
      )
    ).toHaveCount(0);
    await expect(columnIn(page, "bounced").locator(UNSET_POSITION)).toHaveCount(
      0
    );
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

  test("a boolean position narrows on the wire too, and clearing the search restores every row", async ({
    page
  }) => {
    const traffic = await openCanary(page);

    await page.locator(SEARCH).fill("mock-email-3");
    await expect(rows(page)).toHaveCount(1);

    await page.locator(SEARCH).fill("");

    await expect(rows(page)).toHaveCount(3);

    // The restore lands back on the boot combination, which is cached and
    // issues no request (P1-R1) — so the position below is what puts the next
    // request on the wire, and what the cleared search must be absent from.
    await columnIn(page, "verified").locator(YES_POSITION).click();

    await expect
      .poll(() => collectionReads(traffic).at(-1) ?? "")
      .toContain("filter[verified|eq]=1");
    expect(collectionReads(traffic).at(-1)).not.toContain("filter[email|like]");
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

test.describe("@P1-R12 the Inspector carries the page's own tab, and no Debug one", () => {
  test("carries the tab the scenario DECLARED, and offers no Debug tab at all", async ({
    page
  }) => {
    await openCanary(page);

    await openInspector(page);

    await expect(tab(page, CANARY_TAB)).toHaveCount(1);
    await expect(tab(page, "Debug")).toHaveCount(0);
  });

  test("takes its tab with it when the page unmounts — the registration is page-scoped", async ({
    page
  }) => {
    await openCanary(page);
    await openInspector(page);
    await expect(tab(page, CANARY_TAB)).toHaveCount(1);

    await leaveCanary(page);

    await expect(tab(page, CANARY_TAB)).toHaveCount(0);
    // The Inspector itself survives the navigation, so the count above is a
    // deregistration rather than a panel that simply closed.
    await expect(tab(page, "Session (Scoped)")).toHaveCount(1);
  });
});
