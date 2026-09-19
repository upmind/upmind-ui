// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview FE-3031 — `ModulePort.rawMeta()` dereferencing `hasUnpaid` /
 * `consolidatableCount` is what flips their OWN dedicated request gates
 * (2026-09-09 sign-off).
 *
 * ## Job To Be Done
 * `useInvoices().useMeta().hasUnpaid` / `.consolidatableCount` are each
 * backed by their own on-demand query (design.md: "Reading either count
 * flips that count query's request gate, so a scope nobody asks issues no
 * count request"). Before this dispatch nothing in the runtime ever read
 * either member, so neither request ever left. This proves the NEW
 * `ModulePort.rawMeta()` channel is a real dereference, not a stub: calling
 * it is sufficient, on its own, to make both dedicated requests fire against
 * the real composable — and calling it is NECESSARY: skip it, and neither
 * request goes out even though the same list composable is mounted and
 * settled.
 *
 * Uses the same `kit.recorded` / `installInvoiceHandlers` /
 * `observeInvoiceRequests` mechanism `invoices.consolidatable-count.int.
 * test.ts` already proves this module's dedicated-count contract with,
 * re-exposed here through `integrationKits.invoices()`, in preference to the
 * `runtime/force/**` corpus/replay path — that path is independently
 * known-broken for this module's by-id/list default criteria
 * (`forced-surface.invoices.spec.ts`'s disclosed, out-of-write-lane defect).
 *
 * ## What Breaks If These Fail
 * A developer wires `presentation.notices` on a page expecting the two
 * auxiliary reads to fire, and they silently never do — the page shows a
 * permanently-false/zero notice with no error, because nothing ever asked.
 *
 * Negative control: an inline pre-fix shape — the second test below mounts
 * the identical composable and settles it WITHOUT ever calling
 * `port.rawMeta()` (the pre-fix runtime never called it), and neither
 * dedicated request appears.
 */

import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  integrationKits,
  integrationSetups
} from "@upmind-automation/headless/testing";
import declaration from "../../../useInvoices/invoices.scenario";
import { useModulePort } from "../../composables/useModulePort";
import { find, keys } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE = "invoices";

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

type Observed = { all: () => { url: string }[]; stop: () => void };

async function arm() {
  resetScopes();
  server.resetHandlers();
  await (kit.seedClientSession as () => Promise<unknown>)();
  (kit.installInvoiceHandlers as () => void)();
}

const settle = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

/** `oracle:559`/`:581`'s own sentinel divergence — both dedicated count reads send `limit=1` (design.md). */
const isDedicatedCountRead = (url: string) =>
  new URL(url).searchParams.get("limit") === "1";

const isUnpaidExistence = (url: string) =>
  isDedicatedCountRead(url) &&
  decodeURIComponent(url).includes("status.code") &&
  !decodeURIComponent(url).includes("is_consolidation");

const isConsolidatableCount = (url: string) =>
  isDedicatedCountRead(url) &&
  decodeURIComponent(url).includes("is_consolidation");

describe("@AC2/@AC10 ModulePort.rawMeta() — reading a count is what flips its own request gate", () => {
  it("calling port.rawMeta() fires BOTH hasUnpaid's and consolidatableCount's own dedicated requests", async () => {
    await arm();
    const observed = (kit.observeInvoiceRequests as () => Observed)();

    const port = useModulePort(declaration.useList as never, {
      actor: ScopeActorTypes.CLIENT
    });
    await Promise.race([
      (port.actions.isReady as () => Promise<unknown>)(),
      settle(5000)
    ]);
    await settle();

    // The exact dereference `ListSurface` performs for every scope named in
    // `presentation.notices` — see `useModulePort.types.ts`'s own docblock.
    const raw = port.rawMeta?.();
    expect(raw).toBeDefined();
    void raw!.hasUnpaid;
    void raw!.consolidatableCount;

    await settle(2500);
    observed.stop();

    const urls = observed.all().map(request => request.url);
    expect(
      urls.some(isUnpaidExistence),
      "hasUnpaid's own dedicated request never fired after port.rawMeta() dereferenced it"
    ).toBe(true);
    expect(
      urls.some(isConsolidatableCount),
      "consolidatableCount's own dedicated request never fired after port.rawMeta() dereferenced it"
    ).toBe(true);
  });

  it("CONTROL (inline pre-fix shape) — the same mounted, settled composable issues NEITHER dedicated request when rawMeta() is never called", async () => {
    await arm();
    const observed = (kit.observeInvoiceRequests as () => Observed)();

    const port = useModulePort(declaration.useList as never, {
      actor: ScopeActorTypes.CLIENT
    });
    await Promise.race([
      (port.actions.isReady as () => Promise<unknown>)(),
      settle(5000)
    ]);
    await settle(2500);
    observed.stop();

    const urls = observed.all().map(request => request.url);
    expect(
      urls.some(isUnpaidExistence),
      "hasUnpaid's dedicated request fired with nothing ever having read it — the assertion above proves nothing"
    ).toBe(false);
    expect(
      urls.some(isConsolidatableCount),
      "consolidatableCount's dedicated request fired with nothing ever having read it — the assertion above proves nothing"
    ).toBe(false);
  });
});
