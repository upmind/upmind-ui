// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/__tests__/client-custom-fields.replay.int.test
 * @description Runs the module's OWN `client-custom-fields.feature` through its
 * OWN `client-custom-fields.steps.ts`, against the REAL `useClientCustomFields()`
 * collection booted THROUGH THE BARREL, over this module's own MSW-replayed
 * staging recordings — so a step naming a flag the composable does not publish,
 * firing an action id it does not own, or asserting a state the recorded corpus
 * never reaches is RED here, before any page exists.
 *
 * The replay's `it` titles are DYNAMIC — `replayFeature` builds one per
 * non-@todo scenario — so the module's traceability gate (which greps STATIC
 * `describe`/`it` literals) does not count them. That is correct: this file
 * proves the scenarios RUN; the AC<->spec link stays the traceability gate's job.
 *
 * Per ADR-020 Amendment 5, only AC-7 (asking for a fresh copy) is driven — it
 * fires the real `refresh` and reads readiness back over the recorded two-row
 * catalogue. Every "open my definitions" scenario is spec-only and `it.skip`s
 * here, which is the expected, correct outcome for a written-down-not-yet-driven
 * capability.
 *
 * ## What Breaks If These Fail
 * The module's behavioural source of truth stops describing the module: the
 * feature and its catalog drift away from the composable, and nothing says so
 * until a page is built on top of them.
 *
 * @reference `packages/headless/src/modules/client-billing-settings/__tests__/`
 * — the one built replay pair.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useClientCustomFields } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  resetClientCustomFieldsScopes,
  seedClientSession
} from "./client-custom-fields.int-helpers";
import {
  CLIENT_CUSTOM_FIELDS_SCENARIO,
  clientCustomFieldsSteps
} from "./client-custom-fields.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

/**
 * The corpus EVERY scenario starts from: a real authenticated client session
 * (`seedClientSession` also installs the brand/org bootstrap stubs) and this
 * module's OWN recorded two-row definitions catalogue, served for the seeded
 * client's own resolved brand. Nothing here is built — every body is a
 * committed capture the module's `int-helpers` already serves.
 */
async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("client-custom-fields"));
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "client-custom-fields",
  feature: readFileSync(
    join(import.meta.dirname, "client-custom-fields.feature"),
    "utf-8"
  ),
  catalog: clientCustomFieldsSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper — mirrors the built reference.
    [CLIENT_CUSTOM_FIELDS_SCENARIO]:
      useClientCustomFields as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetClientCustomFieldsScopes,
  timeoutMs: 60000
});
