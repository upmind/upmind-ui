// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the co-located feature, REPLAYED
 * (every non-@todo, fully-driven scenario)
 *
 * ## Job To Be Done
 * Run the module's OWN `client-email-history.feature` through its OWN
 * `client-email-history.steps.ts`, against the REAL `useClientReceivedEmails()`
 * collection booted THROUGH THE BARREL, over this module's own MSW-replayed
 * staging recordings — so a step naming a flag the collection does not publish,
 * firing an action id it does not own, or asserting a state the recorded corpus
 * never reaches is RED here, before any page exists.
 *
 * Per ADR-020 Amendment 5 the catalog carries steps only for the scenarios the
 * collection drives end to end; the single-received-email scenarios and the
 * whole-module guarantees carry no steps and `replayFeature` `it.skip`s them —
 * the expected, correct outcome for a capability proven by a sibling int spec
 * rather than driven here.
 *
 * ## What Breaks If These Fail
 * The module's behavioural source of truth stops describing the module: the
 * feature and its catalog drift away from the collection composable, and
 * nothing says so until a page is built on top of them.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useClientReceivedEmails } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  resetClientEmailHistoryScopes,
  seedClientSession
} from "./client-email-history.int-helpers";
import {
  CLIENT_EMAIL_HISTORY_SCENARIO,
  clientEmailHistorySteps
} from "./client-email-history.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

/**
 * The corpus EVERY scenario starts from: a real authenticated client session
 * and this module's OWN recorded list read. Nothing here is built — every body
 * is a committed capture the module's `int-helpers` already serves.
 */
async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("client-email-history"));
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "client-email-history",
  feature: readFileSync(
    join(import.meta.dirname, "client-email-history.feature"),
    "utf-8"
  ),
  catalog: clientEmailHistorySteps,
  composables: {
    // The scope builder types `.as()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper — mirrors the playground's `useCompositionPort` widening.
    [CLIENT_EMAIL_HISTORY_SCENARIO]:
      useClientReceivedEmails as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetClientEmailHistoryScopes,
  timeoutMs: 60000
});
