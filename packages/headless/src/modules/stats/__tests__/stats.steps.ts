// -----------------------------------------------------------------------------
/**
 * @module stats/__tests__/stats.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * DRIVEN `stats.feature` scenarios use. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else runnable, so the same catalog
 * re-registers against any runner (the node replay and the labs playground
 * alike).
 *
 * ONE scenario key is exposed: `stats` boots `useStats`, which carries BOTH
 * concerns on DISTINCT members — the four tile counts and the host-gated usage
 * read. Each count a `Then` asserts is READ off the scenario recording that
 * addressed it (ADR 035 §6), never a copied literal that goes stale on
 * re-record. Absence (null), a real zero (0), the empty guard (isEmpty) and the
 * usage refusal (status + flag) are the business outcomes themselves.
 *
 * @reference `packages/headless/src/modules/legacy-invoices/__tests__/legacy-invoices.steps.ts`
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import usageRefusal from "./scenarios/a-refused-usage-read-is-reported-as-refused/01/get-clients-upmind-usage.json";
import ac2Invoices from "./scenarios/see-how-many-invoices-i-hold-in-every-currency-i-hold-them-in/01/get-stats-currency-code-all-date-to-2026-10-03-type-invoices.json";
import ac3Category from "./scenarios/see-how-many-of-my-invoices-i-have-still-to-pay/01/get-stats-25beace4.json";
import ac4Tickets from "./scenarios/see-how-many-of-my-support-tickets-are-still-open/01/get-stats-date-to-2026-10-03-report-open-type-tickets.json";
import ac1Contracts from "./scenarios/see-how-many-orders-i-have-placed/01/get-stats-currency-code-all-date-to-2026-10-03-type-contracts.json";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** One recorded currency-bound stat read: its `total` report, or null when absent. */
type CurrencyRecording = {
  response: {
    body: { data: { total: { result: { ALL: { count: number }[] } } | null } };
  };
};

/** One recorded tickets read: its `open` report, or null when absent. */
type TicketRecording = {
  response: {
    body: { data: { open: { result: { count: number }[] } | null } };
  };
};

/** One recorded refusal: the wire status it carries. */
type StatusRecording = { response: { status: number } };

/** The currency count a recording published — read, never copied. */
function currencyCount(recording: CurrencyRecording): number | null {
  const report = recording.response.body.data.total;
  return report ? report.result.ALL[0].count : null;
}

/** The tickets count a recording published — read, never copied. */
function ticketCount(recording: TicketRecording): number | null {
  const report = recording.response.body.data.open;
  return report ? report.result[0].count : null;
}

/** AC-1..4 — the four counts, off each scenario's own boot recording. */
const AC1_ORDERS = currencyCount(ac1Contracts as CurrencyRecording);
const AC2_INVOICES = currencyCount(ac2Invoices as CurrencyRecording);
const AC3_UNPAID = currencyCount(ac3Category as CurrencyRecording);
const AC4_TICKETS = ticketCount(ac4Tickets as TicketRecording);

/** AC-14 — the status the recorded usage refusal carries. */
const USAGE_REFUSAL_STATUS = (usageRefusal as StatusRecording).response.status;

// -----------------------------------------------------------------------------

/** The ONE scenario key this feature drives. Named for the consuming playground. */
export const STATS_SCENARIO = "stats";

/**
 * The action ids these steps drive, exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift.
 */
export const STATS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  refreshUsage: "refreshUsage"
} as const;

export const coveredActionIds: readonly string[] = values(
  STATS_COVERED_ACTIONS
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

/** Boots the client cell and waits for the counts to be addressable. */
async function openStats(world: World): Promise<void> {
  await world.boot(STATS_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(STATS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

/** Boots the client cell under a signed-out session — it settles unavailable. */
async function openStatsSignedOut(world: World): Promise<void> {
  await world.boot(STATS_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(STATS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: false }));
}

// -----------------------------------------------------------------------------

export const statsSteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND ============================================================

  Given(
    "I am an authenticated client reading my own dashboard counts",
    openStats
  );

  // === THE FOUR DASHBOARD COUNTS ============================================
  // The counts are read at boot; the re-read the `When` fires carries the same
  // identity, answered by the boot recording, so the outcome is the count
  // staging returned, read off that recording.

  When("I look at my dashboard counts", world =>
    world.fire(STATS_COVERED_ACTIONS.refresh)
  );

  Then("I see the total number of orders I have placed", world =>
    settles(() => world.expectContext({ data: { totalOrders: AC1_ORDERS } }))
  );

  Then(
    "I see the total number of invoices, across every currency I hold them in",
    world =>
      settles(() =>
        world.expectContext({ data: { totalInvoices: AC2_INVOICES } })
      )
  );

  Then("I see how many of my invoices are unpaid or overdue", world =>
    settles(() => world.expectContext({ data: { unpaidInvoices: AC3_UNPAID } }))
  );

  Then("I see how many of my support tickets are still open", world =>
    settles(() => world.expectContext({ data: { activeTickets: AC4_TICKETS } }))
  );

  // === ABSENCE AND ZERO ======================================================
  // The arrangement IS the scenario's own recording: the absent scenario booted
  // a null unpaid-category, the zero scenario a genuine 0 tickets. The `Given`
  // only names the precondition the recording already holds.

  Given("I have none of one of my counted things", () => Promise.resolve());

  Then("that count shows me nothing, and never a zero", world =>
    settles(() => world.expectContext({ data: { unpaidInvoices: null } }))
  );

  Given("I truly have zero of one of my counted things", () =>
    Promise.resolve()
  );

  Then("that count shows me the zero", world =>
    settles(() => world.expectContext({ data: { activeTickets: 0 } }))
  );

  // === THE EMPTY FLAG ========================================================
  // A true zero (tickets) among real numbers (orders/invoices) is not an empty
  // account — the module's own isEmpty guard reads false.

  Given("one of my counts is a true zero, and the others hold numbers", () =>
    Promise.resolve()
  );

  When("I read all of my dashboard counts", world =>
    world.fire(STATS_COVERED_ACTIONS.refresh)
  );

  Then("I am not told my account is empty", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  // === THE TICKET COUNT AND THE BRAND'S SUPPORT SYSTEM =======================
  // The scenario's own boot recording carries the arranged support-system flag
  // (disabled); the `Given` only names it. `isVisible` is the ticket-count guard
  // the module reads from brand config in-memory.

  Given("my brand has turned its support system off", () => Promise.resolve());

  Then("my ticket count is not offered to me", world =>
    settles(() => world.expectMeta({ isVisible: false }))
  );

  // === THE USAGE BLOCK, REFUSAL PATH =========================================
  // The usage refusal is the recorded 409; the two `Given` phrasings name it
  // distinctly so the catalog tells AC-13 from AC-14.

  Given("I am a client whose usage the server refuses", () =>
    Promise.resolve()
  );

  Given("I am a client whose usage read the server turns away", () =>
    Promise.resolve()
  );

  When("I ask for my usage", world =>
    world.fire(STATS_COVERED_ACTIONS.refreshUsage)
  );

  // AC-13 — the usage block is not offered. `isLoadingUsage` settling to false is
  // the read being done, not the refusal; `isUsageVisible` is the visibility fact
  // the refusal drives.
  Then("I am offered no usage block", async world => {
    await settles(() => world.expectMeta({ isLoadingUsage: false }));
    await world.expectMeta({ isUsageVisible: false });
  });

  // AC-14 — the refusal fact itself: the error flag, and the status the recording
  // carries (never its message text — grade ruling).
  Then("I am told my usage was refused", async world => {
    await settles(() => world.expectMeta({ hasUsageError: true }));
    await world.expectContext({
      usageError: { status: USAGE_REFUSAL_STATUS }
    });
  });

  // === AC-19: THE SIGNED-OUT GUARD ===========================================
  // Arms no recording: the wall surfaces any stats or usage request as a capture
  // gap and fails the scenario by name, proving nothing is read.

  Given("I have not signed in yet", openStatsSignedOut);

  When("I try to use my dashboard counts or my usage", async world => {
    await world.fire(STATS_COVERED_ACTIONS.refresh).catch(() => undefined);
    await world.fire(STATS_COVERED_ACTIONS.refreshUsage).catch(() => undefined);
  });

  Then("nothing of mine is offered to me as available", async world => {
    await world.expectMeta({ isAvailable: false });
    await world.expectMeta({ isUsageVisible: false });
  });
});

export default statsSteps;
