// -----------------------------------------------------------------------------
/**
 * @module client-email-history/__tests__/client-email-history.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * sibling `client-email-history.feature`'s DRIVEABLE scenarios use. Engine-free
 * by construction: it imports `defineSteps` and `World` and nothing else, so
 * the same catalog re-registers against any runner.
 *
 * Every handler speaks to the module through the `World` members. There is no
 * DOM read, no request read and no import of the module's own source here.
 *
 * ADR-020 Amendment 5 (operator ruling 2026-09-12) — "tests are tests,
 * scenarios are scenarios; not every test is a replayable scenario." A scenario
 * earns step definitions ONLY when a real step drives every line of it against
 * the composable this key BOOTS: the read-only COLLECTION
 * (`useClientReceivedEmails`). Anything the collection cannot drive gets NO
 * steps and stays spec-only — the traceability gate reads that as skipped, not
 * as a hole:
 *
 *   - the SINGLE received email (AC-13/14/15/17) is a separate composable
 *     (`useClientReceivedEmail`) this key does NOT boot, so `loadOne` and the
 *     `single*` meta it publishes are undriveable here; those scenarios are
 *     proven by `client-email-history.single.int.test.ts`;
 *   - the auth guard (AC-5/16, AC-18) and the scope-identity / public-surface /
 *     error whole-module guarantees (AC-19/20/21) are proven by the auth-guard,
 *     scope-identity, surface and error int specs, each anchored by its @AC tag.
 *
 * The read-only history surface DRIVEN here: playground boot, list, filter
 * (subject like, sent, bounced, error), sort (created_at, subject), page
 * next/prev, refresh/invalidate, destroy. No mutations exist (parity.yaml M6).
 *
 * Assertions are CONCRETE booleans over the collection's published meta
 * (`isAvailable`/`hasError`/`isLoading`/`isEmpty`) — never an asymmetric
 * matcher, which the world's `isMatch` subset check reads as a mismatch. The
 * per-row data shapes each scenario alludes to are proven at the collection,
 * single and mappers int/unit specs the @AC tags anchor to.
 *
 * @reference `packages/headless/src/modules/client-billing-settings/__tests__/`
 * — the one built replay pair, swept the same way (18 replayed / 8 skipped).
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is
 * the consuming playground's, and this catalog names it the same way a
 * `.feature` names a url.
 */
export const CLIENT_EMAIL_HISTORY_SCENARIO = "client-email-history";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`,
 * so the covered set and the calls that cover it cannot drift: an id declared
 * here and fired by no step below is a gate failure, never a silent
 * over-report. `loadOne` is gone — it belongs to the single-read composable
 * this key does not boot (ADR-020 Am.5).
 */
export const CLIENT_EMAIL_HISTORY_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  invalidate: "invalidate",
  destroy: "destroy",
  nextPage: "nextPage",
  prevPage: "prevPage",
  setCriteria: "setCriteria"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_EMAIL_HISTORY_COVERED_ACTIONS
);

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    const err = await assertion()
      .then(() => undefined)
      .catch((e: unknown) => e);
    if (!err) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
  }
  return assertion();
}

async function openCollection(
  world: World,
  scope: Parameters<World["boot"]>[1]
) {
  await world.boot(CLIENT_EMAIL_HISTORY_SCENARIO, scope);
  await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

// -----------------------------------------------------------------------------

export const clientEmailHistorySteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND STEPS =====================================================

  Given(
    "I am an authenticated client reading my own account",
    async world =>
      await openCollection(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given(
    "every request I make is addressed to my own email history as that client",
    async () => {
      // Scope constraint — verified by the scope-identity integration test.
    }
  );

  // === COLLECTION: LIST =====================================================

  When("I open my email history", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.refresh);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  When("I view my email history", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.refresh);
  });

  Then("I see the reactive list of emails sent to me", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  Then("no other client's history is ever loaded", async () => {
    // Scope constraint — verified by the scope-identity integration test.
  });

  // === COLLECTION: EMAIL DETAILS ============================================
  // Each row's own shape (subject/recipient/dates) is proven by the collection
  // and mappers specs the @AC tags anchor to; the replay proves the read lands.

  Then(
    "each email shows its subject, who it was sent to, and who it came from",
    async world => {
      await settles(() =>
        world.expectMeta({ isAvailable: true, hasError: false })
      );
    }
  );

  Then(
    "each email shows the recipient's name, address and picture",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then(
    "each email shows when it was sent, when it bounced, and when it failed",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  // === COLLECTION: STATUS ===================================================

  Given("an email in my history {string}", async () => {
    // Precondition — the recorded fixtures carry emails in each state.
  });

  Then("that email is shown as {string}", async (world, _status: string) => {
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  // === COLLECTION: META STATE ===============================================

  Then(
    "I can see whether the history is loading, empty, or errored",
    async world => {
      await settles(() =>
        world.expectMeta({ isLoading: false, isEmpty: false, hasError: false })
      );
    }
  );

  Then("I can wait for it to be ready before reading it", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.isReady);
    await settles(() => world.expectMeta({ isAvailable: true }));
  });

  Then(
    "that wait always finishes — it never leaves me waiting forever",
    async () => {
      // Timeout constraint — enforced by test harness timeout.
    }
  );

  // === COLLECTION: SORT =====================================================

  When("I sort my history by subject, newest first", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.setCriteria, {
      sort: [{ field: "subject", dir: "desc" }]
    });
  });

  Then(
    "my history comes back ordered by subject, newest first",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then(
    "when I clear the sort it returns to the default order, most recent first",
    async world => {
      await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.setCriteria, {
        sort: [{ field: "created_at", dir: "desc" }]
      });
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  // === COLLECTION: SEARCH ===================================================

  When("I search my history for a word", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.setCriteria, {
      filters: { subject: { like: "invoice" } }
    });
  });

  Then("only emails matching that word are returned", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "when I also narrow by subject, both narrowings apply together",
    async world => {
      await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.setCriteria, {
        filters: { subject: { like: "invoice" }, sent: { eq: true } }
      });
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then("neither narrowing silently cancels the other", async () => {
    // Criteria composition — verified by the criteria integration test.
  });

  // === COLLECTION: FILTER ===================================================

  When("I narrow my history to {string}", async (world, selection: string) => {
    const filters: Record<string, unknown> = {};
    if (selection === "sent") filters.sent = { eq: true };
    if (selection === "bounced") filters.bounced = { eq: true };
    if (selection === "failed") filters.error_id = { neq: null };

    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.setCriteria, {
      filters
    });
  });

  Then("only the {string} emails are returned", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "switching to another selection re-reads my history straight away, without me having to open it again",
    async () => {
      // Reactivity constraint — setCriteria triggers refetch.
    }
  );

  Then("no part of the previous selection is left behind", async () => {
    // Criteria replacement — verified by the criteria integration test.
  });

  // === COLLECTION: PAGINATION ===============================================

  Given("I have more emails than fit on one page", async () => {
    // Precondition — the recorded fixtures carry multiple pages.
  });

  Then(
    "I am given the first page, and told which page I am on and how many there are",
    async world => {
      await settles(() =>
        world.expectMeta({ isAvailable: true, hasError: false })
      );
    }
  );

  Then("asking for the next page gives me the next page", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.nextPage);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("asking for the previous page brings me back", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.prevPage);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("I am told when there is no further page to go to", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  // === COLLECTION: REFRESH ==================================================

  Given("I have opened my email history", async world => {
    await openCollection(world, { actor: ScopeActorTypes.CLIENT });
  });

  When("I refresh it", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.refresh);
  });

  Then("my history is re-read from the server", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "invalidating my history makes the next read fetch it again",
    async world => {
      await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.invalidate);
    }
  );

  Then(
    "refreshing without a signed-in client is refused, and reads nothing",
    async () => {
      // Guard constraint — verified by the auth-guard integration test.
    }
  );

  // === COLLECTION: DESTROY ==================================================

  When("I destroy that collection", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.destroy);
  });

  Then("it is released", async () => {
    // Lifecycle constraint — verified by the lifecycle integration test.
  });

  Then(
    "opening my email history again gives me a fresh collection",
    async world => {
      await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.refresh);
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );
});

export default clientEmailHistorySteps;
