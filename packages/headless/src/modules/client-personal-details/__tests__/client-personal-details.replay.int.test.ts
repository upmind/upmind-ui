// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details — the co-located feature, REPLAYED
 * (every non-@todo, fully-driven scenario)
 *
 * ## Job To Be Done
 * Run the module's OWN `client-personal-details.feature` through its OWN
 * `client-personal-details.steps.ts`, against the REAL `usePersonalDetails()`
 * collection booted THROUGH THE BARREL, over this module's own MSW-replayed
 * staging recordings — so a step naming a flag the collection does not publish,
 * firing an action id it does not own, or asserting a state the recorded corpus
 * never reaches is RED here, before any page exists.
 *
 * Per ADR-020 Amendment 5 the catalog carries steps only for the read
 * scenarios the collection drives end to end; the editor scenarios (driven only
 * through the manager's own actions this key does not boot) and the seed-only
 * load-failure scenario carry no steps and `replayFeature` `it.skip`s them —
 * the expected, correct outcome for a capability proven by a sibling int spec.
 *
 * ## What Breaks If These Fail
 * The module's behavioural source of truth stops describing the module: the
 * feature and its catalog drift away from the collection composable, and
 * nothing says so until a page is built on top of them.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { usePersonalDetails } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  installBrandSettingsHandler,
  installCustomFieldDefinitionsHandler,
  installProfileGetHandler,
  recorded,
  resetClientPersonalDetailsScopes,
  seedClientSession
} from "./client-personal-details.int-helpers";
import {
  CLIENT_PERSONAL_DETAILS_SCENARIO,
  clientPersonalDetailsSteps
} from "./client-personal-details.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

/**
 * The corpus EVERY scenario starts from: a real authenticated client session,
 * this module's OWN recorded profile read, its custom-field definitions and its
 * brand's REAL recorded language list. Nothing here is built — every body is a
 * committed capture the module's `int-helpers` already serves.
 */
async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(
    server,
    await loadModuleCorpus("client-personal-details")
  );
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "client-personal-details",
  feature: readFileSync(
    join(import.meta.dirname, "client-personal-details.feature"),
    "utf-8"
  ),
  catalog: clientPersonalDetailsSteps,
  composables: {
    // The scope builder types `.as()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper — mirrors the playground's `useCompositionPort` widening.
    [CLIENT_PERSONAL_DETAILS_SCENARIO]:
      usePersonalDetails as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetClientPersonalDetailsScopes,
  timeoutMs: 60000
});
