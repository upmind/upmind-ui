// -----------------------------------------------------------------------------
/**
 * @module contract/__tests__/contract.replay
 * @description The co-located `contract.feature`, REPLAYED through the module's
 * own step catalog against the real `useContracts` and `useContract`, booted
 * through the barrel, over the module's recorded corpus served by the ONE
 * shared replay — the same fake API the labs pages arm. Every scenario a step
 * drives runs here; a scenario no step drives is skipped by name (spec-only,
 * ADR-020 Am.5).
 *
 * KNOWN GAP — `@gap contract.feature:101`, "and it updates as my contracts
 * change": the collection publishes no write and the corpus holds no change to
 * a recorded contract, so the track shows the first page as read and nothing
 * can move it between two reads.
 *
 * `@proves contract.feature:115` — the last-page row runs here: the pager's
 * page-position criterion (`setCriteria`) jumps straight to the last recorded
 * page, and the collection says there is no further page.
 *
 * ## What Breaks If These Fail
 * A fake step, a flag the composable does not publish, an action it does not
 * expose, or an assertion the recordings cannot meet — the drift the
 * traceability gate, which matches step TEXT against catalog PATTERNS, can
 * never see.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useContract, useContracts } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import { resetContractScopes, seedClientSession } from "./contract.int-helpers";
import {
  CONTRACTS_SCENARIO,
  CONTRACT_SCENARIO,
  RECORDED,
  contractSteps
} from "./contract.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("contract"));
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "contract",
  feature: readFileSync(join(import.meta.dirname, "contract.feature"), "utf-8"),
  catalog: contractSteps,
  composables: {
    // The scope builder types `.as()` narrowly to each composable's own
    // matrix; `NodeComposable` is the erased shape the World boots.
    [CONTRACTS_SCENARIO]: useContracts as unknown as NodeComposable,
    // The manager page is addressed by its url (`/useContract/<id>`), which the
    // labs world folds in as `.withId(id)`; this replay has no url, so the one
    // recorded contract read's id is bound here.
    [CONTRACT_SCENARIO]: (() =>
      useContract().withId(RECORDED.contract.id)) as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetContractScopes,
  timeoutMs: 60000
});
