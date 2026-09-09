// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview FE-3031 — AC-1's live `unpaidAmount` renders in the detail
 * overlay through `DetailUischema.siblings` (2026-09-09 sign-off).
 *
 * ## Job To Be Done
 * `useInvoice().useContext().unpaidAmount` sits BESIDE `data` on the read
 * composable's context, not inside it — `DetailDialog.vue`'s old snapshot
 * assembly (`model: snap.context.data`) had no way to reach it, so the
 * standalone AC-1 re-read was fetched and thrown away by every surface.
 * `invoices.presentation.ts` now declares `detail.siblings: ["unpaidAmount"]`
 * and a scoped element reading `#/properties/unpaidAmount/properties/
 * amountFormatted`; this proves the overlay actually folds that context
 * sibling into `model` and draws it.
 *
 * ## Provenance
 * The two response bodies served here are the module's OWN recorded
 * fixtures — `get-invoices-id-case-unpaid` and
 * `get-invoices-unpaid-amount-id-currency-id`, read verbatim off the armed
 * corpus (`runtimeCorpus("invoices")`), never authored. They are served
 * through a hand-built path-matched MSW handler rather than
 * `createForceHandlers` because the generic "replay" preset is
 * independently known-broken for this module's by-id routes
 * (`forced-surface.invoices.spec.ts`'s disclosed, out-of-write-lane
 * corpus/replay-routing defect — confirmed live during this dispatch). The
 * DATA is recorded reality; only the routing of which fixture answers which
 * request is hand-wired here, never a constructed response body. Setup
 * order (kit/server resolved BEFORE `armCorpusModule`, everything wired at
 * module scope before any `it()` runs) mirrors `forced-surface.harness.ts`
 * exactly — the one shape proven, in this suite, to actually intercept this
 * module's requests under `happy-dom`.
 *
 * ## What Breaks If These Fail
 * A client opens an invoice, the page fetches the live unpaid amount, and it
 * never reaches the screen — AC-1 fetched-and-discarded, same failure shape
 * the "known caveats" describe as fixed.
 *
 * Negative control: an inline pre-fix shape — mounting the SAME overlay with
 * `siblings` stripped from the presentation reproduces the pre-fix state
 * (the sibling had no declared path into `model`) and the live amount drops
 * off the screen, proving the assertion actually depends on the fix rather
 * than on something else in the mount.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  integrationKits,
  integrationSetups
} from "@upmind-automation/headless/testing";
import declaration from "../../../useInvoices/invoices.scenario";
import { armCorpusModule, runtimeCorpus } from "../../force/corpus";
import DetailDialog from "../DetailDialog.vue";
import {
  filter,
  find,
  flatMap,
  isString,
  keys,
  map,
  uniq,
  values
} from "lodash-es";
import type { RecordedFixture } from "../../force/corpus.source.types";
import type { DetailUischema } from "../../scenario.types";

// -----------------------------------------------------------------------------

const MODULE = "invoices";

window.matchMedia =
  window.matchMedia ||
  ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    }) as unknown as MediaQueryList);

function stringLeaves(node: unknown): string[] {
  if (isString(node)) return [node];
  if (Array.isArray(node)) return flatMap(node, stringLeaves);
  if (node && typeof node === "object")
    return flatMap(values(node as object), stringLeaves);
  return [];
}

const DETAIL = declaration.presentation.detail as DetailUischema;

// -----------------------------------------------------------------------------
// Module-scope setup — same order `forced-surface.harness.ts` uses, and the
// one order proven (in this suite) to actually intercept this module's
// requests under `happy-dom`: kit/server resolved BEFORE `armCorpusModule`.

const kit = (await integrationKits[MODULE]()) as Record<string, unknown>;
const { server } = (await integrationSetups[MODULE]()) as {
  server: {
    use: (...handlers: unknown[]) => void;
    resetHandlers: () => void;
  };
};
const resetScopes = kit[
  find(keys(kit), key => /^reset.*Scopes?$/.test(key)) as string
] as () => void;

await armCorpusModule(MODULE);
const bodies = runtimeCorpus(MODULE);
if (!bodies)
  throw new Error(
    `${MODULE}: force loaded no corpus, so unpaidAmount cannot be proven on the detail overlay`
  );

const unpaidAmountFixture = find(
  values(bodies),
  fixture =>
    fixture.request.path.includes("/invoices/unpaid_amount/") &&
    fixture.response.status < 400
) as RecordedFixture;
if (!unpaidAmountFixture)
  throw new Error(
    `${MODULE}: no recorded 200 unpaid_amount fixture — nothing to key the detail read on`
  );

const idMatch = unpaidAmountFixture.request.path.match(
  /\/invoices\/unpaid_amount\/([^/?]+)/
);
if (!idMatch)
  throw new Error(
    `${MODULE}: recorded unpaid_amount path carries no invoice id`
  );
const RECORD_ID = idMatch[1];

const invoiceFixture = find(
  values(bodies),
  fixture =>
    fixture.request.path.startsWith(`/api/invoices/${RECORD_ID}?`) &&
    fixture.response.status < 400
) as RecordedFixture;
if (!invoiceFixture)
  throw new Error(
    `${MODULE}: no recorded 200 by-id fixture for ${RECORD_ID} — the same real record the unpaid_amount fixture was captured against`
  );

/** Every string leaf on the recorded unpaid-amount body — the values a real screen may honestly show. */
const RECORDED_UNPAID_AMOUNT_STRINGS = uniq(
  filter(
    stringLeaves(
      (unpaidAmountFixture.response.body as { data?: unknown }).data
    ),
    value => value.length > 0
  )
);

async function arm() {
  resetScopes();
  server.resetHandlers();
  await (kit.seedClientSession as () => Promise<unknown>)();
  (kit.installBackgroundStubs as (target: unknown) => void)(server);
  // The two recorded fixtures, served by a plain path match — see this
  // file's "Provenance" note for why this bypasses `createForceHandlers`.
  server.use(
    http.get("*/invoices/unpaid_amount/:id", () =>
      HttpResponse.json(unpaidAmountFixture.response.body, {
        status: unpaidAmountFixture.response.status
      })
    ),
    http.get("*/invoices/:id", () =>
      HttpResponse.json(invoiceFixture.response.body, {
        status: invoiceFixture.response.status
      })
    )
  );
}

async function openedText(presentation: DetailUischema) {
  const wrapper = mount(DetailDialog, {
    attachTo: document.body,
    props: {
      record: { id: RECORD_ID },
      detail: {
        useDetail: declaration.useDetail!,
        actor: ScopeActorTypes.CLIENT,
        identifier: "id"
      },
      id: RECORD_ID,
      presentation,
      actions: []
    }
  });
  await flushPromises();
  await new Promise(resolve => setTimeout(resolve, 800));
  await flushPromises();
  const text = document.body.textContent ?? "";
  wrapper.unmount();
  return text;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("@AC-1 detail overlay — unpaidAmount is a real, drawn context sibling", () => {
  it("renders the live recorded unpaid amount when the detail declares the sibling", async () => {
    await arm();

    expect(
      RECORDED_UNPAID_AMOUNT_STRINGS,
      "the recorded unpaid_amount fixture has no string leaf to prove against"
    ).not.toEqual([]);
    expect(DETAIL.siblings).toContain("unpaidAmount");

    const text = await openedText(DETAIL);

    expect(
      filter(RECORDED_UNPAID_AMOUNT_STRINGS, value => text.includes(value)),
      "the detail overlay never drew a single value out of the recorded unpaid_amount response"
    ).not.toEqual([]);
  });

  // Standing guard: six composite fields on this same detail (address,
  // currency, products, payments, consolidation, bundle.groups) rendered
  // literally "[object Object]" before invoices.presentation.ts scoped each
  // to a scalar leaf or a mapper-derived summary string. The full,
  // real-record-backed detail mount above is where a seventh would appear.
  it('never renders the literal string "[object Object]" anywhere in the detail', async () => {
    await arm();
    const text = await openedText(DETAIL);

    expect(text).not.toContain("[object Object]");
  });

  it("CONTROL (inline pre-fix shape) — with siblings stripped, the sibling's OWN element draws nothing extra", async () => {
    // This invoice's `summary.balanceFormatted` (a DIFFERENT, already-declared
    // detail field) happens to equal the same recorded unpaid amount for this
    // fully-unpaid record — a plain `includes()` on that digit string cannot
    // tell the two apart. `occurrences()` can: with the sibling declared, the
    // value's own scoped element is a SECOND source for the same digits,
    // stripping it removes exactly that one occurrence, never more.
    await arm();
    const withSiblings = await openedText(DETAIL);
    const withoutSiblings = await openedText({
      ...DETAIL,
      siblings: undefined
    });

    const occurrences = (text: string, value: string) =>
      text.split(value).length - 1;

    const deltas = map(RECORDED_UNPAID_AMOUNT_STRINGS, value => ({
      value,
      with: occurrences(withSiblings, value),
      without: occurrences(withoutSiblings, value)
    }));

    expect(
      filter(deltas, delta => delta.with > delta.without),
      "stripping the sibling declaration removed no occurrence of any recorded unpaid_amount value — the assertion above proves nothing"
    ).not.toEqual([]);
  });
});
