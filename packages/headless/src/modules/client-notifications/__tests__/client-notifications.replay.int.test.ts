// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications — the co-located feature, REPLAYED
 * (every non-@todo, fully-driven scenario)
 *
 * ## Job To Be Done
 * Run the module's OWN `client-notifications.feature` through its OWN
 * `client-notifications.steps.ts`, against the REAL `useClientNotifications()`
 * collection booted THROUGH THE BARREL, over this module's own MSW-replayed
 * staging recordings — so a step naming a flag the collection does not publish,
 * firing an action id it does not own, or asserting a state the recorded corpus
 * never reaches is RED here, before any page exists.
 *
 * Per ADR-020 Amendment 5 the catalog carries steps only for the read
 * scenarios the collection drives end to end; the editor scenarios (driven only
 * through the manager's `manage`/`editRow` handoffs the world cannot fire) and
 * the denial cells (read off the port's `isServed`, not the composable's meta)
 * carry no steps and `replayFeature` `it.skip`s them — the expected, correct
 * outcome for a capability proven by a sibling manager int spec.
 *
 * ## What Breaks If These Fail
 * The module's behavioural source of truth stops describing the module: the
 * feature and its catalog drift away from the collection composable, and
 * nothing says so until a page is built on top of them.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useClientNotifications } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  installNotificationsReadHandlers,
  resetClientNotificationsScopes,
  seedClientSession
} from "./client-notifications.int-helpers";
import {
  CLIENT_NOTIFICATIONS_SCENARIO,
  clientNotificationsSteps
} from "./client-notifications.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

/**
 * The corpus EVERY scenario starts from: a real authenticated client session
 * and this module's OWN recorded topics/channels/opt-outs reads. Nothing here
 * is built — every body is a committed capture the module's `int-helpers`
 * already serves.
 */
async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("client-notifications"));
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "client-notifications",
  feature: readFileSync(
    join(import.meta.dirname, "client-notifications.feature"),
    "utf-8"
  ),
  catalog: clientNotificationsSteps,
  composables: {
    // The scope builder types `.as()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper — mirrors the playground's `useCompositionPort` widening.
    [CLIENT_NOTIFICATIONS_SCENARIO]:
      useClientNotifications as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetClientNotificationsScopes,
  timeoutMs: 60000
});
