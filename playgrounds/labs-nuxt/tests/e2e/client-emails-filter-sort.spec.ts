// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/client-emails-filter-sort
 * @description The AC7 read-backs the shared `client-email.feature`
 * cannot carry, because `World` has five members and none of them is the page,
 * the wire or a reload: a filter NARROWS THE RENDERED ROWS through a real
 * re-query, a sort REORDERS them, a sort field the module does not offer never
 * reaches the wire, and both survive a reload (design §6 — "assert the outbound
 * request").
 *
 * The rows are the recorded 3-row corpus and the collection handler branches on
 * the request's own params, so a client-side-only filter leaves the served rows
 * untouched and every assertion below goes red.
 */

import { expect, test } from "@playwright/test";
import { clientEmailsRoute } from "./catalogs";
import {
  installRecordedCorpus,
  seedRecordedClientSession
} from "./recorded-corpus";
import { map } from "lodash-es";
import type { RecordedTraffic } from "./recorded-corpus";
import type { Page } from "@playwright/test";

// -----------------------------------------------------------------------------

const RECORDED = {
  verified: "mock-email-1@example.com",
  unverifiedNewest: "mock-email-4@example.com",
  unverifiedOlder: "mock-email-3@example.com"
} as const;

/**
 * The address cell of every rendered row, in render order — the FIRST column
 * since G3, because `client-emails.presentation.ts` declares `email` first and
 * the table draws declared columns only.
 */
function renderedAddresses(page: Page) {
  return page.locator("tbody tr td:nth-child(1)");
}

/** Every collection read this lane observed, newest last. */
function collectionReads(traffic: RecordedTraffic): string[] {
  return traffic
    .requests()
    .filter(entry => /GET \S+\/emails\?/.test(entry))
    .map(entry => decodeURIComponent(entry));
}

async function openClientEmails(page: Page): Promise<RecordedTraffic> {
  const traffic = await installRecordedCorpus(page);
  await seedRecordedClientSession(page);
  await page.goto(clientEmailsRoute);
  await expect(renderedAddresses(page)).toHaveCount(3);
  await page.evaluate(async () => {
    const world = (window as unknown as Record<string, unknown>)
      .__upmindScenarioWorld as {
      boot: (key: string, scope: unknown) => Promise<void>;
    };
    await world.boot("client_emails", { actor: "client" });
  });
  return traffic;
}

async function drive(page: Page, action: string, input: unknown) {
  await page.evaluate(
    async ([actionId, payload]) => {
      const world = (window as unknown as Record<string, unknown>)
        .__upmindScenarioWorld as {
        fire: (id: string, input?: unknown) => Promise<void>;
      };
      await world.fire(actionId as string, payload);
    },
    [action, input] as const
  );
}

// -----------------------------------------------------------------------------

test.describe("@AC7 client-emails filter and sort on the client-emails page", () => {
  test("a filter narrows the rendered rows through a real re-query", async ({
    page
  }) => {
    const traffic = await openClientEmails(page);

    await drive(page, "filterBy", { verified: { eq: false } });

    await expect(renderedAddresses(page)).toHaveCount(2);
    await expect(renderedAddresses(page)).not.toContainText([
      RECORDED.verified
    ]);
    expect(collectionReads(traffic).at(-1)).toContain("filter[verified|eq]=0");
  });

  test("a sort reorders the rendered rows and ships the order param", async ({
    page
  }) => {
    const traffic = await openClientEmails(page);

    await drive(page, "sortBy", [{ field: "email", dir: "asc" }]);
    await expect(renderedAddresses(page)).toHaveText([
      RECORDED.verified,
      RECORDED.unverifiedOlder,
      RECORDED.unverifiedNewest
    ]);
    expect(collectionReads(traffic).at(-1)).toContain("order=email");

    await drive(page, "sortBy", [{ field: "email", dir: "desc" }]);
    await expect(renderedAddresses(page)).toHaveText([
      RECORDED.unverifiedNewest,
      RECORDED.unverifiedOlder,
      RECORDED.verified
    ]);
    expect(collectionReads(traffic).at(-1)).toContain("order=-email");
  });

  test("a sort field the module does not offer never reaches the wire", async ({
    page
  }) => {
    const traffic = await openClientEmails(page);

    await drive(page, "sortBy", [{ field: "title", dir: "asc" }]);
    await page.waitForTimeout(1000);

    expect(
      map(collectionReads(traffic), read => read.includes("title"))
    ).not.toContain(true);
  });

  test("the filter and the sort survive a reload", async ({ page }) => {
    const traffic = await openClientEmails(page);

    await drive(page, "filterBy", { verified: { eq: false } });
    await drive(page, "sortBy", [{ field: "email", dir: "desc" }]);
    await expect(renderedAddresses(page)).toHaveCount(2);

    const beforeReload = page.url();
    const readsBeforeReload = collectionReads(traffic).length;
    await page.reload();

    await expect(renderedAddresses(page)).toHaveText([
      RECORDED.unverifiedNewest,
      RECORDED.unverifiedOlder
    ]);
    expect(page.url()).toBe(beforeReload);

    // CHECKPOINT A answer 1: the cold boot must SEED the criteria, not fetch
    // unfiltered and correct itself. Reading only the last request cannot tell
    // those apart, so the whole reload path is read and counted.
    await page.waitForTimeout(1000);
    const afterReload = collectionReads(traffic).slice(readsBeforeReload);

    expect(afterReload).toHaveLength(1);
    expect(afterReload[0]).toContain("filter[verified|eq]=0");
    expect(afterReload[0]).toContain("order=-email");
  });
});
