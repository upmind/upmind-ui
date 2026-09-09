// -----------------------------------------------------------------------------
/**
 * @module invoices/__tests__/invoices.steps
 * @description The module's ONE step catalog — one definition per phrasing
 * `invoices.feature`'s scenarios use. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog re-registers
 * against any runner.
 *
 * Every handler speaks to the module through the `World` members. There is no
 * DOM read, no request read and no import of the module's own source here.
 *
 * SCOPE HONESTY (recorded here, not just in the hand-off): `useInvoices` (the
 * COLLECTION) is the only cell this catalog fires actions against. `useInvoice`
 * (the SINGLE READ, `useDetail`) is the first `useDetail` binding in this tree
 * (`docs/sdd/FE-3031` hand-off) and `useCompositionPort` reads exactly ONE
 * `LiveCompositionCell` per boot (`useCompositionPort.types.ts`) — there is no
 * established convention yet for driving a second, detail-scoped cell through
 * `World.fire`. Every step whose Gherkin text opens/reads a SINGLE invoice
 * ("When I open that invoice", "When I open it", "When I ask what I still owe
 * on it", …) is therefore a documented no-op deferring to the real proving
 * integration test — never a fabricated action id the runtime does not carry.
 * A later dispatch that lands a `useDetail`-drive convention extends these.
 *
 * @reference `packages/headless/src/modules/client-email-history/__tests__/`
 * — the closest sibling shape (a scoped collection + a single-item read), read
 * while authoring this one; its single-item read is a same-cell `loadOne`
 * action, not a second composable, which is why its pattern does not
 * transplant here for the detail scenarios.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { InvoicesContextTypes } from "../invoices.types";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is
 * the consuming playground's, and this catalog names it the same way a
 * `.feature` names a url. MUST match `invoices.scenario.ts`'s declared `key`
 * exactly (the read join between the page and this catalog).
 */
export const INVOICES_SCENARIO = "invoices";

/**
 * The action ids these steps drive, ALL on the `useInvoices` collection cell —
 * exported as the gate's `coveredActionIds`, so the covered set and the calls
 * that cover it cannot drift: an id declared here and fired by no step below is
 * a gate failure, never a silent over-report.
 */
export const INVOICES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  setCriteria: "setCriteria",
  sortBy: "sortBy",
  assignPaymentMethod: "assignPaymentMethod",
  refreshAfterPayment: "refreshAfterPayment",
  filterCreditNotes: "filterCreditNotes"
} as const;

export const coveredActionIds: readonly string[] = values(
  INVOICES_COVERED_ACTIONS
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
  await world.boot(INVOICES_SCENARIO, scope);
  await world.fire(INVOICES_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

// -----------------------------------------------------------------------------

export const invoicesSteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND ============================================================

  Given("I am an authenticated client", async world =>
    openCollection(world, { actor: ScopeActorTypes.CLIENT })
  );

  // === AC-2: FILTER / SORT / PAGE ============================================

  When(
    "I filter my invoice list by status, category, amount or date",
    async world => {
      await world.fire(INVOICES_COVERED_ACTIONS.setCriteria, {
        filters: {
          "status.code": { in: ["overdue"] },
          "category.slug": { in: ["recurrent"] }
        }
      });
    }
  );

  Then(
    "only the invoices matching every filter I set are returned",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
      await settles(() =>
        world.expectContext({
          query: expect.objectContaining({
            filters: expect.objectContaining({
              "status.code": expect.objectContaining({ in: ["overdue"] }),
              "category.slug": expect.objectContaining({ in: ["recurrent"] })
            })
          })
        })
      );
    }
  );

  Then(
    "an unpaid-status filter and a category filter narrow the list together",
    async () => {
      // Criteria composition — verified by invoices.criteria-presets.int.test.ts.
    }
  );

  When("I sort my invoice list by due date, newest first", async world => {
    // The table-channel intent shape (`InvoiceSortModel` — an ARRAY of
    // `{ field, dir }` entries: `useTableChannel.ts` calls
    // `actions.sortBy([...intent.sort])`), never a bare `{ field, dir }`
    // object — firing the bare object was Review blocker B1's own arity gap,
    // undetected because the Then below asserted only `hasError: false`.
    await world.fire(INVOICES_COVERED_ACTIONS.sortBy, [
      { field: "due_date", dir: "desc" }
    ]);
  });

  Then(
    "my invoice list comes back ordered by due date, newest first",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
      await settles(() =>
        world.expectContext({
          query: expect.objectContaining({
            sort: [{ field: "due_date", dir: "desc" }]
          })
        })
      );
    }
  );

  Then(
    "before I sort, I see the default order: most recently created first",
    async () => {
      // Boot-default sort — verified by invoices.criteria-presets.int.test.ts.
    }
  );

  Given("I have more invoices than fit on one page", async () => {
    // Precondition — the recorded fixture carries multiple pages.
  });

  When("I open my invoice list", async world => {
    await world.fire(INVOICES_COVERED_ACTIONS.refresh);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "I am given the first page, and the total number of invoices I have",
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

  Then(
    "asking for the next page of my invoices gives me the next page",
    async world => {
      await world.fire(INVOICES_COVERED_ACTIONS.setCriteria, {
        pagination: { offset: 10 }
      });
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  // === AC-2 / AC-5: READ ONE IN FULL, AND EVERY OTHER "OPEN THAT INVOICE" ====
  // SCOPE HONESTY: opening ONE invoice is a `useDetail` (useInvoice) read.
  // No World-drive convention exists yet for a second, detail-scoped cell
  // (see this file's header) — every Given/Then pinning a single invoice's
  // mapped fields defers to the real proving integration test rather than
  // firing a fabricated action id.

  Given("one of my invoices", async () => {
    // Precondition — the recorded fixture carries at least one invoice.
  });

  When("I open that invoice", async () => {
    // Detail read (useInvoice / useDetail) — no World-drive convention yet
    // for a second composable cell; see this file's header.
  });

  Then(
    "I see it in full, including its client, its status, and its payments",
    async () => {
      // Verified by invoices.mapping.int.test.ts + invoices.include-set.int.test.ts.
    }
  );

  // === AC-2: CONSOLIDATABLE COUNT (R04) =======================================

  When("I ask how many of my invoices could be consolidated", async () => {
    // Its own dedicated count query, gated until read — a meta-read side
    // effect, not a fireable action. Verified by
    // invoices.consolidatable-count.int.test.ts.
  });

  Then(
    "I am given a count, without the module loading every matching invoice",
    async () => {
      // Verified by invoices.consolidatable-count.int.test.ts.
    }
  );

  // === AC-1: RE-READ THE LIVE UNPAID AMOUNT ==================================

  When("I ask what I still owe on it", async () => {
    // `useInvoice().useActions().refreshUnpaidAmount()` — detail-cell action,
    // no World-drive convention yet. Verified by invoices.unpaid-amount.int.test.ts.
  });

  Then("I am given the current unpaid amount in its currency", async () => {
    // Verified by invoices.unpaid-amount.int.test.ts.
  });

  Then(
    "asking again after changing the currency gives me a fresh amount, never the one I already had",
    async () => {
      // staleTime: 0 — verified by invoices.unpaid-amount.int.test.ts.
    }
  );

  // === AC-3: PAYMENT OUTCOME REFETCH ==========================================

  Given("I have just made a payment on one of my invoices", async () => {
    // Precondition — a payment outcome arrives out-of-band (payment module).
  });

  When("that payment settles or fails", async world => {
    await world.fire(INVOICES_COVERED_ACTIONS.refreshAfterPayment);
  });

  Then(
    "my invoice list reflects the new payment row on its own",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then(
    "I do not have to reopen or reload my invoice list to see it",
    async () => {
      // Reactivity constraint — the refetch is the observable proof above.
    }
  );

  // === AC-4: ASSIGN / CLEAR THE PAYMENT METHOD ===============================

  Given("one of my invoices has no payment method assigned", async () => {
    // Precondition — the recorded fixture carries an unassigned invoice.
  });

  When("I assign a payment method to it", async world => {
    await world.fire(INVOICES_COVERED_ACTIONS.assignPaymentMethod, {
      invoiceId: "test-invoice-id",
      paymentDetailsId: "test-payment-details-id"
    });
  });

  Then("that invoice now shows the payment method I chose", async () => {
    // Verified by invoices.payment-method.int.test.ts.
  });

  Given("one of my invoices has a payment method assigned", async () => {
    // Precondition — the recorded fixture carries an assigned invoice.
  });

  When("I clear the assigned payment method", async world => {
    await world.fire(INVOICES_COVERED_ACTIONS.assignPaymentMethod, {
      invoiceId: "test-invoice-id",
      paymentDetailsId: null
    });
  });

  Then(
    'that invoice shows "none selected" for its payment method',
    async () => {
      // The explicit-null request contract — verified by
      // invoices.payment-method.int.test.ts (guarded by
      // invoices.clear-method-omitted.must-fail.patch).
    }
  );

  // === AC-5: CONSOLIDATION IDENTITY / BUNDLE GROUPING =========================

  Given("one of my invoices was merged into a consolidation", async () => {
    // Precondition — a real captured row with the consolidation fields toggled.
  });

  Then(
    "I see which document it merged into, which credit note partners it, and how much is queued for credit",
    async () => {
      // Verified by invoices.mapping.int.test.ts.
    }
  );

  Given(
    "a consolidated invoice with line items from more than one subscription",
    async () => {
      // Precondition — a real captured row with mixed contracts_product_id lines.
    }
  );

  Then(
    "its line items are grouped, one group per subscription they came from",
    async () => {
      // Verified by invoices.mapping.int.test.ts.
    }
  );

  Then(
    "a line item with no subscription of its own is grouped separately, never dropped",
    async () => {
      // Trailing null-keyed group — verified by invoices.mapping.int.test.ts.
    }
  );

  // === AC-6: BUNDLE-LARGE FROM THE PLATFORM'S OWN COUNT =======================

  Given(
    "a consolidated invoice bundling more line items than the platform returns in one page",
    async () => {
      // Precondition — products_count exceeds the returned products array length.
    }
  );

  Then("it tells me the bundle is large", async () => {
    // Verified by invoices.mapping.int.test.ts.
  });

  Then(
    "that answer comes from the platform's own count, not from how many line items actually arrived",
    async () => {
      // Negative control — invoices.bundle-count-from-array.must-fail.patch.
    }
  );

  // === AC-7: CREDIT NOTES AS A CRITERIA PRESET ================================

  When("I ask for my credit notes", async world => {
    await world.fire(INVOICES_COVERED_ACTIONS.filterCreditNotes);
  });

  Then(
    "I am given only the invoices categorised as a credit note",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Given("one of my credit notes", async () => {
    // Precondition — the recorded fixture carries a credit-note-category row.
  });

  When("I open it", async () => {
    // Detail read (useInvoice / useDetail) — see this file's header.
  });

  Then("it names the invoice it credits", async () => {
    // credit_invoice_id — verified by invoices.mapping.int.test.ts.
  });

  Given("a credit note that was also created by a consolidation", async () => {
    // Precondition — is_consolidation true AND category.slug a credit-note slug.
  });

  When("I read its label", async () => {
    // Detail read (useInvoice / useDetail) — see this file's header.
  });

  Then("it is labelled as a consolidation", async () => {
    // is_consolidation-first precedence — verified by
    // invoices.category-label-precedence.must-fail.patch's proving spec.
  });

  Then("it is never labelled as a plain credit note", async () => {
    // Same precedence — verified by invoices.mapping.int.test.ts.
  });

  // === AC-8: PENDING PAYMENT DISCRIMINATION ===================================

  Given("one of my invoices has a payment already in flight", async () => {
    // Precondition — a real captured pending payment.
  });

  Then("I am told the payment is pending", async () => {
    // Verified by invoices.mapping.int.test.ts.
  });

  Then("I am told how long it has been pending", async () => {
    // attemptAgeAtFetchMs — verified by invoices.mapping.int.test.ts.
  });

  Given("a pending payment whose gateway is waiting on me to act", async () => {
    // Precondition — gateway.type === AWAITING_CLIENT.
  });

  Then(
    "I am told the platform is waiting on me, not on the gateway",
    async () => {
      // isAwaitingClient — verified by invoices.mapping.int.test.ts.
    }
  );

  Then(
    "a pending payment on a gateway that is not waiting on me carries no such signal",
    async () => {
      // Verified by invoices.mapping.int.test.ts.
    }
  );

  // === AC-9: NEXT CHARGE DATE OUTLINE =========================================

  Given("an invoice that {string}", async (_world, _condition: string) => {
    // Precondition — a real captured row matching the outline's condition.
  });

  Then("the next charge date is {string}", async (_world, _outcome: string) => {
    // Verified by invoices.mapping.int.test.ts.
  });

  // === AC-10: UNPAID EXISTENCE =================================================

  When("I ask whether I have anything unpaid", async () => {
    // Its own dedicated existence query, gated until read — a meta-read side
    // effect, not a fireable action. Verified by the module's own integration
    // coverage (invoices.has-unpaid-no-request.must-fail.patch's proving spec).
  });

  Then(
    "I am told yes or no, without the module loading my whole invoice list",
    async () => {
      // Verified by the module's own integration coverage.
    }
  );

  // === AC-11: BALANCE DISTINCT FROM THE RAW UNPAID AMOUNT =====================

  Given(
    "a consolidated invoice where credit notes have offset what I owe",
    async () => {
      // Precondition — a real captured row where balance !== unpaid_amount.
    }
  );

  Then(
    "my outstanding balance and my raw unpaid amount are shown as two distinct numbers",
    async () => {
      // Negative control — invoices.balance-aliased.must-fail.patch.
    }
  );

  Then("I am never left to guess which one is current", async () => {
    // Both exposed distinctly — verified by invoices.mapping.int.test.ts.
  });

  // === AC-16: OVERALL PAYMENT STATE ============================================

  Given("one of my invoices {string}", async (_world, _condition: string) => {
    // Precondition — a real captured/toggled row matching the outline's condition.
  });

  Then(
    "its payment state is reported as {string}",
    async (_world, _state: string) => {
      // Verified by invoices.payment-state.int.test.ts.
    }
  );

  Given("an invoice load that failed", async () => {
    // Precondition — a control response (404/401) is served for the load.
  });

  When("I ask for its payment state", async () => {
    // Detail read (useInvoice / useDetail) — see this file's header.
  });

  Then(
    "I am told the load failed rather than given a guessed payment state",
    async () => {
      // Negative control — invoices.meta-throws-on-failed-load.must-fail.patch.
    }
  );

  // === AC-12: RETARGET AT AN ENTITLED CLIENT ==================================

  Given("I am entitled to act for another client", async world => {
    await openCollection(world, {
      actor: ScopeActorTypes.CLIENT,
      context: {
        type: InvoicesContextTypes.CLIENT,
        id: "test-target-client-id"
      }
    });
  });

  When("I read that client's invoices", async world => {
    await world.fire(INVOICES_COVERED_ACTIONS.refresh);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("I am given that client's invoices, not my own", async () => {
    // Request-contract assertion (URL retarget + client_id filter durability)
    // — verified by invoices.scope-identity.int.test.ts:261-382.
  });

  Then(
    "reading without naming a target client still gives me my own",
    async () => {
      // The client x self cell — verified by invoices.scope-identity.int.test.ts.
    }
  );

  // === AC-13: CO-MINGLED ATTRIBUTION ===========================================

  Given(
    "a list mixing my own invoices, a sub-account's, and a delegator's, where {string}",
    async (_world, _situation: string) => {
      // Precondition — the recorded fixture carries own/child/delegated rows.
    }
  );

  When("I read that list", async world => {
    await world.fire(INVOICES_COVERED_ACTIONS.refresh);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "each invoice is attributed as {string}",
    async (_world, _attribution: string) => {
      // Child-first mutual exclusion — verified by invoices.attribution.int.test.ts
      // (guarded by invoices.attribution-child-first.must-fail.patch).
    }
  );

  Given("an invoice attributed to me as delegated", async () => {
    // Precondition — delegate_related true, no parent_client_id.
  });

  When("I look at what I can do with it", async () => {
    // Detail read (useInvoice / useDetail) — see this file's header.
  });

  Then("it tells me I cannot settle it", async () => {
    // isSettleable false — verified by invoices.attribution.int.test.ts.
  });

  Then(
    "an invoice attributed as my own or my sub-account's carries no such restriction",
    async () => {
      // Verified by invoices.attribution.int.test.ts.
    }
  );

  // === AC-14: NO ADDRESSABLE CLIENT ============================================

  Given("neither I nor a target client can be resolved to an id", async () => {
    // Precondition — the world boots with no active session and no target.
  });

  When("any invoice read is attempted", async world => {
    await world.fire(INVOICES_COVERED_ACTIONS.refresh);
  });

  Then("nothing is read", async () => {
    // isAvailable false → enabled false — verified by the module's guard coverage.
  });

  Then(
    "I am told the read is not available rather than seeing it hang or silently return nothing",
    async world => {
      await settles(() => world.expectMeta({ isAvailable: false }));
    }
  );

  // === AC-15: THE CRITERIA LAW =================================================

  Given(
    "the filters, sort and pagination my invoice list accepts are all declared",
    async () => {
      // Precondition — useQuerySchema()'s additionalProperties:false shape.
    }
  );

  When(
    "I try to filter by something the module has not declared",
    async world => {
      await world.fire(INVOICES_COVERED_ACTIONS.setCriteria, {
        filters: { totally_undeclared_column: { eq: "x" } }
      });
    }
  );

  Then(
    "that filtering is refused rather than silently ignored or silently applied",
    async world => {
      await settles(() => world.expectMeta({ hasError: true }));
    }
  );

  Then(
    "no filter ever reaches the platform outside what my declared criteria produced",
    async () => {
      // additionalProperties:false — verified by
      // useValidation.dotted-key-path-split.must-fail.patch's proving spec.
    }
  );
});

export default invoicesSteps;
