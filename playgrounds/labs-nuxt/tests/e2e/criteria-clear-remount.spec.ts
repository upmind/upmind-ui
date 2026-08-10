// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/criteria-clear-remount
 * @description DIAGNOSIS lane (P1-R7 · P1-R2, step 0): the operator's own
 * reproduction, driven in the browser over the recorded corpus.
 *
 * Every layer beneath this passes on its own — core clears
 * (`criteria-clear.int.test.ts`), the renderer's ✕ empties its leaf
 * (`filter-clear.test.ts`), the bar forwards it verbatim
 * (`filter-bar-clear.spec.ts`) and the url sync drops the param
 * (`criteria-url-sync-clear.spec.ts`). What no unit lane can see is the three
 * of them composed: the ✕ clicked on the REAL page, with the url writing
 * itself and the page keyed on `route.fullPath`.
 *
 * Measured together, because they are the same event:
 *   - the clear: rows widen and the param leaves the LAST collection read;
 *   - the remount: how much of the page's DOM survives a filter change (P1-R2
 *     says none of it should be torn down) versus a scope change (which must).
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
const VERIFIED = `${FILTER_BAR} [data-test-key="form-item"][data-test-value="filters-verified"]`;
const SWITCH = '[role="switch"]';
const CLEAR = '[data-test-value="all"]';
const VERIFIED_PARAM = "filter[verified|eq]";
/** The url's own spelling of the same column (task 58's persistence). */
const VERIFIED_URL_PARAM = "filter.verified.eq";

const urlParam = (page: Page, name: string): string | null =>
  new URL(page.url()).searchParams.get(name);

const rows = (page: Page) => page.locator("tbody tr");

const collectionReads = (traffic: RecordedTraffic): string[] =>
  traffic
    .requests()
    .filter(entry => /GET \S+\/emails\?/.test(entry))
    .map(entry => decodeURIComponent(entry));

async function openCanary(page: Page): Promise<RecordedTraffic> {
  const traffic = await installRecordedCorpus(page);
  await seedRecordedClientSession(page);
  await page.goto(canaryRoute);
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

// -----------------------------------------------------------------------------

test.describe("@P1-R7 clearing a tri-state filter on the real page", () => {
  test("takes the column off the wire and brings every row back", async ({
    page
  }) => {
    const traffic = await openCanary(page);
    const control = page.locator(VERIFIED);

    await control.locator(SWITCH).click();
    await expect(rows(page)).toHaveCount(1);
    expect(collectionReads(traffic).at(-1)).toContain(`${VERIFIED_PARAM}=1`);
    // The url carries it too, so the clear below has a persisted value to
    // contradict — without this the clear read-back proves nothing.
    await expect.poll(() => urlParam(page, VERIFIED_URL_PARAM)).toBe("true");

    await control.locator(CLEAR).click();

    await expect(rows(page)).toHaveCount(3);
    expect(collectionReads(traffic).at(-1)).not.toContain(VERIFIED_PARAM);
    await expect.poll(() => urlParam(page, VERIFIED_URL_PARAM)).toBeNull();
  });

  test("survives a reload after the clear — the url carries no cleared column", async ({
    page
  }) => {
    const traffic = await openCanary(page);
    const control = page.locator(VERIFIED);

    await control.locator(SWITCH).click();
    await expect(rows(page)).toHaveCount(1);
    await control.locator(CLEAR).click();
    await expect(rows(page)).toHaveCount(3);

    await page.reload();

    await expect(rows(page)).toHaveCount(3);
    expect(collectionReads(traffic).at(-1)).not.toContain(VERIFIED_PARAM);
  });
});

// Measured 2026-08-10 on `feature/FE-2977`: a filter write leaves all 11
// stamped ancestors standing, a scope push leaves 5 (the layout shell). The
// url sync writes through `history.replaceState`, which vue-router never
// observes, so `route.fullPath` — and the page key derived from it — does not
// move on a filter change. The key is a latent hazard, not the active defect.
test.describe("@P1-R2 what a criteria change tears down", () => {
  test("a filter change remounts nothing — the page tree survives it", async ({
    page
  }) => {
    await openCanary(page);
    const stamped = await stampPageTree(page);

    await page.locator(VERIFIED).locator(SWITCH).click();
    await expect(rows(page)).toHaveCount(1);
    // The url DID change — so a page keyed on `fullPath` had every chance to
    // tear the tree down, and the survival count below is falsifiable.
    await expect.poll(() => urlParam(page, VERIFIED_URL_PARAM)).toBe("true");

    expect(await survivingStamps(page)).toBe(stamped);
  });

  test("a scope change DOES remount, and retargets the read", async ({
    page
  }) => {
    const traffic = await openCanary(page);
    const stamped = await stampPageTree(page);
    expect(stamped).toBeGreaterThan(0);

    // Pushed through the app's OWN router, never `page.goto` — a full document
    // navigation would wipe the stamps whatever the page is keyed on, and
    // prove nothing about the key.
    await page.evaluate(async path => {
      const nuxt = (
        window as unknown as {
          useNuxtApp: () => {
            $router: { push: (to: string) => Promise<void> };
          };
        }
      ).useNuxtApp();
      await nuxt.$router.push(path);
    }, `${canaryRoute}/for/client/mock-client-id`);
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toContain(`${canaryRoute}/for/client/mock-client-id`);
    await expect(page.locator(FILTER_BAR)).toHaveCount(1);

    expect(await survivingStamps(page)).toBeLessThan(stamped);
    expect(collectionReads(traffic).at(-1)).toContain(
      "/clients/mock-client-id/emails"
    );
  });
});
