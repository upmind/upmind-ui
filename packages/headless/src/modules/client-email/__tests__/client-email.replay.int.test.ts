// -----------------------------------------------------------------------------
/**
 * @module client-email/__tests__/client-email.replay
 * @description The co-located `client-email.feature`, REPLAYED through the module's own
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
import { useClientEmails } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  resetClientEmailScopes,
  seedClientSession
} from "./client-email.int-helpers";
import {
  CLIENT_EMAILS_SCENARIO,
  clientEmailsSteps
} from "./client-email.steps";
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
  installCorpusReplay(server, await loadModuleCorpus("client-email"));
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "client-email",
  feature: readFileSync(
    join(import.meta.dirname, "client-email.feature"),
    "utf-8"
  ),
  catalog: clientEmailsSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper.
    [CLIENT_EMAILS_SCENARIO]: useClientEmails as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetClientEmailScopes,
  timeoutMs: 60000
});
