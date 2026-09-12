// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and the one built spec it
 * cites. Authority: `packages/headless/src/testing/replay-feature.ts` (the
 * `replayFeature` contract) and `agent-seat-separation` (this file is the
 * PROVER's). A disagreement between the skeleton, the reference spec and the
 * contract is a surfaced finding, never silently resolved toward either.
 *
 * Emitted by the PROVER seat into
 * `packages/headless/src/modules/<module>/__tests__/`. ONE per module, beside
 * the ONE feature and the ONE catalog it replays.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useModuleManager } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {

  resetModuleScopes,
  seedClientSession
} from "./module.int-helpers";
import { server } from "./setup.integration";
import { MODULES_SCENARIO, modulesSteps } from "./module.steps";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------
/**
 * @module module/__tests__/module.replay.int.test
 * @description Runs the module's OWN `module.feature` through its OWN
 * `module.steps.ts`, against the REAL `useModuleManager()` booted THROUGH THE
 * BARREL, over the module's own MSW-replayed recordings — so a step naming a
 * flag the composable does not publish, firing an action id it does not own, or
 * asserting a state the recorded corpus never reaches is RED here, before any
 * page exists.
 *
 * The replay's `it` titles are DYNAMIC — `replayFeature` builds one per
 * non-@todo scenario from its `@AC-<n>` tags + title — so the module's
 * traceability gate (which greps STATIC `describe`/`it` literals) does not
 * count them. That is correct: this file proves the scenarios RUN; the
 * AC<->spec link stays the traceability gate's own job.
 *
 * ## What Breaks If These Fail
 * The module's behavioural source of truth stops describing the module: the
 * feature and its catalog drift away from the composable, and nothing says so
 * until a page is built on top of them.
 *
 * @reference `packages/headless/src/modules/client-billing-settings/__tests__/`
 * — the one built replay pair, read while authoring this skeleton, never a
 * match target.
 */

// -----------------------------------------------------------------------------

/**
 * The corpus EVERY scenario starts from: a real authenticated session, and the
 * module's OWN recordings served by the ONE shared replay
 * (`@upmind-automation/test-fixtures/corpus-replay`, installed through
 * `testing/corpus-replay`). It is the same fake API the labs page arms: reads
 * answer with the request's criteria applied to the recorded rows, a write is
 * answered by the recording of the same write and lands where the next read
 * looks. Nothing here is built and no module route is hand-wired — a request
 * the recordings cannot answer is a capture gap, surfaced as a red, never a
 * stub.
 */
async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("module"));
}

/**
 * Preconditions ("Given loading my … fails", "Given my record is a staged
 * import") are JOURNEYS: `WorldScope.seed` names one, and this test serves it
 * — from the module's OWN kit and recordings only. A failed read is the
 * module's recorded forced-status capture (`case=server-error`, the generator's
 * `forceStatus`); a record variant is the kit's single-field override of a real
 * recording. NEVER an inline `server.use(http.…)` here: that is a second,
 * hand-wired replay, and the shape the 2026-09-12 sweep had to throw away.
 * A precondition the kit cannot serve leaves its scenario spec-only — no steps,
 * skipped by name — not a stub.
 */

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "module",
  feature: readFileSync(join(import.meta.dirname, "module.feature"), "utf-8"),
  catalog: modulesSteps,
  composables: {
    // The scenario key maps to the composable the feature's steps actually
    // DRIVE (D19): a manager-only catalog boots the manager; a catalog whose
    // scenarios need the read half's `refresh` CANNOT be served by the manager
    // alone — that mismatch surfaces as `unknown action` on the first read
    // step, which is the point, not a fault in this file. The scope builder
    // types `.as()`/`.for()` narrowly to the module's own actor×context matrix,
    // so ONE widening cast at the seam erases it to the structural shape the
    // World boots — never loosen the helper.
    [MODULES_SCENARIO]: useModuleManager as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetModuleScopes,
  timeoutMs: 60000
});
