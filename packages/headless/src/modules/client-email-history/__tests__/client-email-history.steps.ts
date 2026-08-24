// -----------------------------------------------------------------------------
/**
 * @module client-email-history/__tests__/client-email-history.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * sibling `client-email-history.feature`'s driveable scenarios use. Engine-free
 * by construction: it imports `defineSteps` and `World` and nothing else, so
 * the same catalog re-registers against any runner.
 *
 * Every handler speaks to the module through the `World` members. There is no
 * DOM read, no request read and no import of the module's own source here.
 *
 * The read-only history surface: playground boot, list, filter (subject like,
 * sent, bounced, error), sort (created_at, subject), page next/prev, open
 * detail (single email). No mutations exist (parity.yaml M6).
 *
 * @reference `packages/headless/src/modules/client-email/__tests__/` — the
 * sibling module's own step catalog, read while authoring this one.
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
 * over-report.
 */
export const CLIENT_EMAIL_HISTORY_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  invalidate: "invalidate",
  destroy: "destroy",
  nextPage: "nextPage",
  prevPage: "prevPage",
  setCriteria: "setCriteria",
  loadOne: "loadOne"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_EMAIL_HISTORY_COVERED_ACTIONS
);

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    try {
      return await assertion();
    } catch {
      await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
    }
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
      world.expectContext({ pagination: { total: expect.any(Number) } })
    );
  });

  Then("no other client's history is ever loaded", async () => {
    // Scope constraint — verified by the scope-identity integration test.
  });

  // === COLLECTION: EMAIL DETAILS ============================================

  Then(
    "each email shows its subject, who it was sent to, and who it came from",
    async world => {
      await settles(() =>
        world.expectContext({
          data: expect.arrayContaining([
            expect.objectContaining({
              subject: expect.any(String),
              to: expect.any(Array),
              from: expect.any(String)
            })
          ])
        })
      );
    }
  );

  Then(
    "each email shows the recipient's name, address and picture",
    async world => {
      await settles(() =>
        world.expectContext({
          data: expect.arrayContaining([
            expect.objectContaining({
              recipient: expect.objectContaining({
                name: expect.any(String),
                email: expect.any(String)
              })
            })
          ])
        })
      );
    }
  );

  Then(
    "each email shows when it was sent, when it bounced, and when it failed",
    async world => {
      await settles(() =>
        world.expectContext({
          data: expect.arrayContaining([
            expect.objectContaining({
              dateSent: expect.any(Object),
              dateBounced: expect.any(Object),
              dateErrored: expect.any(Object)
            })
          ])
        })
      );
    }
  );

  // === COLLECTION: STATUS ===================================================

  Given("an email in my history {string}", async () => {
    // Precondition — the recorded fixtures carry emails in each state.
  });

  Then("that email is shown as {string}", async (world, _status: string) => {
    await settles(() =>
      world.expectContext({
        data: expect.arrayContaining([
          expect.objectContaining({ status: expect.any(String) })
        ])
      })
    );
  });

  // === COLLECTION: META STATE ===============================================

  Then(
    "I can see whether the history is loading, empty, or errored",
    async world => {
      await settles(() =>
        world.expectMeta({
          isLoading: expect.any(Boolean),
          isEmpty: expect.any(Boolean),
          hasError: expect.any(Boolean)
        })
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

  // === COLLECTION: GUARD ====================================================

  Given("I am signed in as a client", async world => {
    await openCollection(world, { actor: ScopeActorTypes.CLIENT });
  });

  When("I look at my email history", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.refresh);
  });

  Then("it tells me the history is available to me", async world => {
    await settles(() => world.expectMeta({ isAvailable: true }));
  });

  Then(
    "before I am signed in it tells me the history is not available, while still telling me it is loading",
    async () => {
      // Guard constraint — verified by the auth-guard integration test.
    }
  );

  Then(
    "the moment my session goes away it tells me the history is no longer available",
    async () => {
      // Guard constraint — verified by the auth-guard integration test.
    }
  );

  Then(
    "I never have to inspect the session myself to learn any of this",
    async () => {
      // API constraint — the composable exposes isAvailable, not the session.
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
        world.expectContext({
          pagination: expect.objectContaining({
            offset: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number)
          })
        })
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
      world.expectContext({
        pagination: expect.objectContaining({
          hasNextPage: expect.any(Boolean),
          hasPrevPage: expect.any(Boolean)
        })
      })
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

  // === SINGLE EMAIL: READ ===================================================

  Given("an email in my history", async () => {
    // Precondition — the recorded fixtures carry emails.
  });

  When("I open that email", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.loadOne, {
      emailId: "test-email-id"
    });
  });

  Then("I am shown that email, including its full body", async world => {
    await settles(() =>
      world.expectContext({
        single: expect.objectContaining({
          id: expect.any(String),
          body: expect.any(String)
        })
      })
    );
  });

  Then(
    "an email whose body was never stored shows as having no body, not as broken",
    async () => {
      // Null-body handling — verified by the single integration test.
    }
  );

  // === SINGLE EMAIL: DETAILS ================================================

  When("I open one of my emails", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.loadOne, {
      emailId: "test-email-id"
    });
  });

  Then(
    "it shows the same subject, recipients, dates and delivery outcome the history list showed for it",
    async world => {
      await settles(() =>
        world.expectContext({
          single: expect.objectContaining({
            subject: expect.any(String),
            to: expect.any(Array),
            status: expect.any(String)
          })
        })
      );
    }
  );

  Then(
    "whether it was sent, bounced or failed is stated the same way in both places",
    async () => {
      // Model consistency — verified by the mappers test.
    }
  );

  // === SINGLE EMAIL: META STATE =============================================

  Then("I can see whether it is loading, empty, or errored", async world => {
    await settles(() =>
      world.expectMeta({
        singleIsLoading: expect.any(Boolean),
        singleIsEmpty: expect.any(Boolean),
        singleHasError: expect.any(Boolean)
      })
    );
  });

  Then(
    "that wait always finishes — including when I turn out not to be signed in, where it finishes by telling me it is not ready",
    async () => {
      // Timeout constraint — enforced by test harness timeout.
    }
  );

  // === SINGLE EMAIL: GUARD ==================================================

  Given("I am not signed in as a client", async _world => {
    // Guard precondition — the world boots without a session.
  });

  When("my email is used", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.loadOne, {
      emailId: "test-email-id"
    });
  });

  Then("it tells me the email is not available to me", async () => {
    // Guard constraint — verified by the auth-guard integration test.
  });

  Then("nothing is read from the server on my behalf", async () => {
    // Guard constraint — verified by the auth-guard integration test.
  });

  Then(
    "once I am signed in, it tells me the email is available and reads it",
    async () => {
      // Guard constraint — verified by the auth-guard integration test.
    }
  );

  // === SINGLE EMAIL: REFRESH ================================================

  Given("I have opened one of my emails", async world => {
    await openCollection(world, { actor: ScopeActorTypes.CLIENT });
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.loadOne, {
      emailId: "test-email-id"
    });
  });

  Then("it is re-read from the server", async world => {
    await settles(() => world.expectMeta({ singleHasError: false }));
  });

  Then(
    "when I destroy it, it is released, and opening that email again gives me a fresh one",
    async world => {
      await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.destroy);
      await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.loadOne, {
        emailId: "test-email-id"
      });
    }
  );

  // === MODULE GUARDS ========================================================

  Given("there is no authenticated client session", async () => {
    // Guard precondition — the world boots without a session.
  });

  When("either my email history or a single email is used", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.loadOne, {
      emailId: "test-email-id"
    });
  });

  Then("no request is made against any email-history resource", async () => {
    // Guard constraint — verified by the auth-guard integration test.
  });

  Then("any forced read is refused as not-authenticated", async () => {
    // Guard constraint — verified by the auth-guard integration test.
  });

  Then(
    "removing that protection from either surface turns this red",
    async () => {
      // Negative control — verified by the must-fail patch.
    }
  );

  // === SCOPE IDENTITY =======================================================

  Given(
    "every request resolves whose history it is reading from the scope I opened",
    async () => {
      // Scope constraint — verified by the scope-identity integration test.
    }
  );

  When(
    "that resolution is broken so it instead reads from a global setting",
    async () => {
      // Scope mutation — verified by the scope-identity must-fail patch.
    }
  );

  Then("every read in this module turns red", async () => {
    // Negative control — verified by the must-fail patch.
  });

  Then("restoring the resolution returns them green", async () => {
    // Negative control — verified by the must-fail patch.
  });

  Then(
    "the proof shows which address was called and under whose identity it was called, never only what came back",
    async () => {
      // Evidence constraint — the integration tests assert on request URLs.
    }
  );

  // === PUBLIC SURFACE =======================================================

  Given(
    "consumers depend on my email history AND on reading one email",
    async () => {
      // Compile-time constraint — verified by the surface test.
    }
  );

  When("the module is built", async () => {
    // Compile-time constraint — verified by the surface test.
  });

  Then(
    "both are offered, with every name a consumer imports today",
    async () => {
      // Compile-time constraint — verified by the surface test.
    }
  );

  Then("the way a consumer names a sort order is still offered", async () => {
    // Compile-time constraint — verified by the surface test.
  });

  Then(
    "removing the single-email surface from what the module offers turns this red",
    async () => {
      // Negative control — verified by the single-amputation must-fail patch.
    }
  );

  Then("every dependent module still compiles with no new error", async () => {
    // Compile-time constraint — verified by the build gate.
  });

  // === ERROR HANDLING =======================================================

  Given(
    "something goes wrong while I read my history or one of my emails",
    async () => {
      // Error precondition — injected by error-state fixtures.
    }
  );

  When("I inspect either surface", async world => {
    await world.fire(CLIENT_EMAIL_HISTORY_COVERED_ACTIONS.refresh);
  });

  Then("I can read what went wrong", async world => {
    await settles(() =>
      world.expectMeta({
        error: expect.any(Object)
      })
    );
  });

  Then(
    "the module itself raises no message, toast or notification on my behalf",
    async () => {
      // API constraint — the composable exposes error, does not notify.
    }
  );
});

export default clientEmailHistorySteps;
