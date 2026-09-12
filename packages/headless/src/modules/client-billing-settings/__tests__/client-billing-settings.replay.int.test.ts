// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings — the co-located feature, REPLAYED
 * (every non-@todo scenario)
 *
 * ## Job To Be Done
 * Run the module's OWN `client-billing-settings.feature` through the module's
 * OWN `client-billing-settings.steps.ts`, against the REAL
 * `useBillingSettingsManager()` booted THROUGH THE BARREL, over this module's
 * own MSW-replayed staging recordings — so a step naming a flag the manager
 * does not publish, firing an action id it does not own, or asserting a state
 * the recorded corpus never reaches is RED here, before any page exists.
 *
 * Until now nothing but the labs playground has ever executed these steps, and
 * a playground runs them against whatever composable it happens to have wired.
 * This binds the catalog to the module's real barrel export and replays it
 * against the real wire, so a `fire(<id>)` for an action the manager does not
 * publish, or an `expectMeta({<flag>})` naming a member the layer never
 * exposes, surfaces as a failed scenario rather than staying silent — the kind
 * of drift that matching step TEXT against catalog PATTERNS (the traceability
 * test) can never see.
 *
 * ## What Breaks If These Fail
 * The module's behavioural source of truth stops describing the module: the
 * feature and its catalog drift away from the composable, and nothing says so
 * until a page is built on top of them.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { useBillingSettingsManager } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  installBrandSettingsHandler,
  installSettingsGetHandler,
  installSettingsPutEchoHandler,
  recorded,
  resetClientBillingSettingsScopes,
  seedClientSession
} from "./client-billing-settings.int-helpers";
import {
  CLIENT_BILLING_SETTINGS_SCENARIO,
  clientBillingSettingsSteps
} from "./client-billing-settings.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

/**
 * The corpus EVERY scenario starts from: a real authenticated client session,
 * this module's own recorded client record on the read, the real-merge echo on
 * the write, and the brand's REAL recorded currency list. Nothing here is
 * built — every body is a committed capture the kit already serves.
 */
async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(
    server,
    await loadModuleCorpus("client-billing-settings")
  );
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "client-billing-settings",
  feature: readFileSync(
    join(import.meta.dirname, "client-billing-settings.feature"),
    "utf-8"
  ),
  catalog: clientBillingSettingsSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper — mirrors the playground's `useCompositionPort` widening.
    [CLIENT_BILLING_SETTINGS_SCENARIO]:
      useBillingSettingsManager as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetClientBillingSettingsScopes,
  timeoutMs: 60000
});
