// -----------------------------------------------------------------------------
/**
 * @module client-phone/__tests__/client-phone.replay
 * @description The co-located `client-phone.feature`, REPLAYED through the module's own
 * step catalog against the real composable, over the module's recorded corpus
 * served by the ONE shared replay (`@upmind-automation/test-fixtures/corpus-replay`)
 * — the same fake API the labs page arms. Every scenario a step drives runs
 * here before any page exists; a scenario no step drives is skipped by name
 * (spec-only, ADR-020 Am.5).
 *
 * ## What Breaks If These Fail
 * A fake step, a flag the composable does not publish, an action it does not
 * expose, or an assertion the recordings cannot meet — the drift matching step
 * TEXT against catalog PATTERNS (the traceability test) can never see.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useClientPhones } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  resetClientPhoneScopes,
  seedClientSession
} from "./client-phone.int-helpers";
import {
  CLIENT_PHONES_SCENARIO,
  clientPhonesSteps
} from "./client-phone.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

/**
 * The corpus EVERY scenario starts from: a real authenticated client session,
 * and this module's own recordings behind the shared replay. Nothing here is
 * built and no module route is hand-wired.
 */
async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("client-phone"));
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "client-phone",
  feature: readFileSync(
    join(import.meta.dirname, "client-phone.feature"),
    "utf-8"
  ),
  catalog: clientPhonesSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper.
    [CLIENT_PHONES_SCENARIO]: useClientPhones as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetClientPhoneScopes,
  timeoutMs: 60000
});
