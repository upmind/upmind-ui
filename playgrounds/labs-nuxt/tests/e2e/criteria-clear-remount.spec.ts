// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/criteria-clear-remount
 * @description The clear law and the remount law, composed on the real page
 * (P1-R7 · P1-R2) over the recorded corpus.
 *
 * Every layer beneath this passes on its own — core clears
 * (`criteria-clear.int.test.ts`), the renderer's ✕ empties its leaf
 * (`filter-clear.test.ts`), the bar forwards it verbatim
 * (`filter-bar-clear.spec.ts`) and the url sync drops the param
 * (`criteria-url-sync-clear.spec.ts`). What no unit lane can see is the three
 * of them composed: the ✕ clicked on the REAL page, with the url writing itself
 * under a page that is keyed.
 *
 * The remount law: **a criteria write preserves the page, a scope change resets
 * it.** The criteria persists into the QUERY string and the scope into the
 * PATH, so the key is the path — a page that keyed on `route.fullPath` tore
 * itself down on every filter and re-booted the composable from scratch.
 * Teardown is read off stamps written onto the live DOM, since what survives an
 * interaction is the only observable the key has.
 */

import { expect, test } from "@playwright/test";
import { clientEmailsRoute } from "./catalogs";
import {
  installRecordedCorpus,
  seedRecordedClientSession
} from "./recorded-corpus";
import type { RecordedTraffic } from "./recorded-corpus";
import type { Page } from "@playwright/test";

// -----------------------------------------------------------------------------

const FILTER_BAR = '[data-test-key="filters"]';
const VERIFIED = `${FILTER_BAR} [data-test-key="form-item"][data-test-value="filters-verified"]`;
/** The labelled treatment's set position, and the unset one it clears back to. */
const SET = '[data-test-value="yes"]';
const CLEAR = '[data-test-value="all"]';
const VERIFIED_PARAM = "filter[verified|eq]";
/** The url's own spelling of the same column (task 58's persistence). */
const VERIFIED_URL_PARAM = "filter.verified.eq";
/** A second column, so the settle below is a combination nothing has fetched. */
const SETTLE_CONTROL = `${FILTER_BAR} [data-test-key="form-item"][data-test-value="filters-bounced"]`;
/** The label-less treatment names its positions by the value each writes. */
const SETTLE_POSITION = '[data-test-value="true"]';
const SETTLE_PARAM = "filter[bounced|eq]";

const urlParam = (page: Page, name: string): string | null =>
  new URL(page.url()).searchParams.get(name);

const rows = (page: Page) => page.locator("tbody tr");

const collectionReads = (traffic: RecordedTraffic): string[] =>
  traffic
    .requests()
    .filter(entry => /GET \S+\/emails\?/.test(entry))
    .map(entry => decodeURIComponent(entry));

/**
 * Toggles a column no earlier step wrote, so the claim "the cleared param left
 * the wire" is read off a request that exists: clearing lands back on the boot
 * combination, which the cache law (P1-R1) says must issue none of its own.
 */
async function settle(page: Page, traffic: RecordedTraffic): Promise<void> {
  await page.locator(SETTLE_CONTROL).locator(SETTLE_POSITION).click();
  await expect
    .poll(() => collectionReads(traffic).at(-1) ?? "")
    .toContain(SETTLE_PARAM);
}

async function openClientEmails(page: Page): Promise<RecordedTraffic> {
  const traffic = await installRecordedCorpus(page);
  await seedRecordedClientSession(page);
  await page.goto(clientEmailsRoute);
  await expect(rows(page)).toHaveCount(3);
  return traffic;
}

/**
 * Stamps every ancestor of the filter bar up to `<body>`, so what SURVIVES an
 * interaction says how far up the tree Vue tore down. The chain climbs THROUGH
 * the page into the layout shell, so a remount kills the page-owned lower half
 * and leaves the shell standing — never all of it, which is why the read-back
 * below is a comparison and not a zero.
 */
async function stampPageTree(page: Page): Promise<number> {
  return page.evaluate(bar => {
    let node = document.querySelector(bar)?.parentElement ?? null;
    let depth = 0;
    while (node && node !== document.body) {
      node.setAttribute("data-probe-mount", String(depth++));
      node = node.parentElement;
    }
    return depth;
  }, FILTER_BAR);
}

const survivingStamps = (page: Page): Promise<number> =>
  page.evaluate(() => document.querySelectorAll("[data-probe-mount]").length);

/**
 * Navigates through the app's OWN router. A `page.goto` is a document
 * navigation: it would wipe the stamps whatever the page is keyed on, and so
 * prove nothing about the key.
 */
async function driveRouter(
  page: Page,
  verb: "push" | "replace",
  to: string
): Promise<void> {
  await page.evaluate(
    async ([method, target]) => {
      const nuxt = (
        window as unknown as {
          useNuxtApp: () => {
            $router: Record<string, (to: string) => Promise<void>>;
          };
        }
      ).useNuxtApp();
      await nuxt.$router[method]!(target);
    },
    [verb, to] as const
  );
}

// -----------------------------------------------------------------------------

test.describe("@P1-R7 clearing a tri-state filter on the real page", () => {
  test("takes the column off the wire and brings every row back", async ({
    page
  }) => {
    const traffic = await openClientEmails(page);
    const control = page.locator(VERIFIED);

    await control.locator(SET).click();
    await expect(rows(page)).toHaveCount(1);
    expect(collectionReads(traffic).at(-1)).toContain(`${VERIFIED_PARAM}=1`);
    // The url carries it too, so the clear below has a persisted value to
    // contradict — without this the clear read-back proves nothing.
    await expect.poll(() => urlParam(page, VERIFIED_URL_PARAM)).toBe("true");

    await control.locator(CLEAR).click();

    await expect(rows(page)).toHaveCount(3);
    await expect.poll(() => urlParam(page, VERIFIED_URL_PARAM)).toBeNull();

    await settle(page, traffic);
    expect(collectionReads(traffic).at(-1)).not.toContain(VERIFIED_PARAM);
  });

  test("survives a reload after the clear — the url carries no cleared column", async ({
    page
  }) => {
    const traffic = await openClientEmails(page);
    const control = page.locator(VERIFIED);

    await control.locator(SET).click();
    await expect(rows(page)).toHaveCount(1);
    await control.locator(CLEAR).click();
    await expect(rows(page)).toHaveCount(3);

    await page.reload();

    await expect(rows(page)).toHaveCount(3);
    expect(collectionReads(traffic).at(-1)).not.toContain(VERIFIED_PARAM);
  });
});

test.describe("@P1-R2 what a criteria change tears down", () => {
  test("a filter change remounts nothing — the page tree survives it", async ({
    page
  }) => {
    await openClientEmails(page);
    const stamped = await stampPageTree(page);

    await page.locator(VERIFIED).locator(SET).click();
    await expect(rows(page)).toHaveCount(1);
    // The url DID change — so a page keyed on `fullPath` had every chance to
    // tear the tree down, and the survival count below is falsifiable.
    await expect.poll(() => urlParam(page, VERIFIED_URL_PARAM)).toBe("true");

    expect(await survivingStamps(page)).toBe(stamped);
  });

  test("a criteria change carried by the ROUTER remounts nothing either", async ({
    page
  }) => {
    await openClientEmails(page);
    const stamped = await stampPageTree(page);
    expect(stamped).toBeGreaterThan(0);

    // The url sync writes through `history.replaceState` today, which
    // vue-router never observes — so only a router-carried write actually moves
    // `route.fullPath` and exercises the key the page is built on.
    await driveRouter(
      page,
      "replace",
      `${clientEmailsRoute}?${VERIFIED_URL_PARAM}=true`
    );
    await expect.poll(() => urlParam(page, VERIFIED_URL_PARAM)).toBe("true");
    await expect(page.locator(FILTER_BAR)).toHaveCount(1);

    expect(await survivingStamps(page)).toBe(stamped);
  });

  test("a scope change DOES remount, and retargets the read", async ({
    page
  }) => {
    const traffic = await openClientEmails(page);
    const stamped = await stampPageTree(page);
    expect(stamped).toBeGreaterThan(0);

    await driveRouter(
      page,
      "push",
      `${clientEmailsRoute}/for/client/mock-client-id`
    );
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toContain(`${clientEmailsRoute}/for/client/mock-client-id`);
    await expect(page.locator(FILTER_BAR)).toHaveCount(1);

    expect(await survivingStamps(page)).toBeLessThan(stamped);
    expect(collectionReads(traffic).at(-1)).toContain(
      "/clients/mock-client-id/emails"
    );
  });
});
