// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the colocated feature, replayed
 *
 * ## Job To Be Done
 * Run the module's own `client-orders.feature` through its own
 * `client-orders.steps.ts`, against the real `useClientOrders()` collection
 * booted through the barrel, over this module's recorded corpus served by the
 * one shared replay. The six design 8.12 scenarios run. Every other scenario
 * carries a phrase the catalog does not define, so `replayFeature` skips it:
 * a SKIP is a spec-only contract scenario, proven by its sibling spec.
 *
 * ## What Breaks If These Fail
 * A step names a flag the collection does not publish, fires an action id it
 * does not own, or asserts a model the recorded corpus never reaches — so the
 * labs-nuxt `bdd` project would fail on the page before anyone saw why.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useClientOrders } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  resetClientOrderScopes,
  seedClientSession
} from "./client-orders.int-helpers";
import {
  CLIENT_ORDERS_SCENARIO,
  clientOrdersSteps
} from "./client-orders.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("client-orders"));
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "client-orders",
  feature: readFileSync(
    join(import.meta.dirname, "client-orders.feature"),
    "utf-8"
  ),
  catalog: clientOrdersSteps,
  composables: {
    [CLIENT_ORDERS_SCENARIO]: useClientOrders as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetClientOrderScopes,
  timeoutMs: 60000
});
