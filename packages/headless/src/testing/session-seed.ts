// -----------------------------------------------------------------------------
/**
 * @module testing/session-seed
 * @description The ONE tag-driven session seed a module's `arrangeScenario`
 * reads. Every module's arrange seeds a real client session first
 * (`seedClientSession()`), so no scenario can start signed out — which a
 * capability a GUEST reaches (a public invoice link, a signed-out lookup)
 * needs. `@signed-out` is that switch: a scenario carrying it seeds NO client
 * session, and the store's own guest session (its own access token, held
 * already) identifies the caller.
 *
 * The replay wall stays on either way: a signed-out module that sends a request
 * its scenario never recorded is a capture gap, and it fails the scenario by
 * name — which is exactly the proof that a signed-out capability sends no
 * authenticated request.
 *
 * A module adopts it with one line — `await seedSessionFor(scenario,
 * seedClientSession, seedGuestSession)` in place of `await
 * seedClientSession()`, where `seedGuestSession` arms the same owner boot
 * recordings and signs no client in.
 */

import { includes } from "lodash-es";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The tag a scenario carries to boot with the guest session only — no client sign-in. */
export const SIGNED_OUT_TAG = "@signed-out";

/**
 * Seeds the session a scenario boots behind: the module's own client session,
 * unless the scenario is tagged {@link SIGNED_OUT_TAG}, in which case the
 * module's own GUEST seed runs instead.
 *
 * The guest seed is the module's, not this helper's, because the boot reads a
 * session makes are answered by the OWNER recordings the module's kit arms
 * (`installBackgroundStubs`): a signed-out scenario still boots the app, so
 * those reads must be armed exactly as for a signed-in one — only the client
 * sign-in is left out.
 *
 * @param scenario The scenario about to run — read for its `@signed-out` tag.
 * @param seedClientSession The module's own client-session seed, called only
 * for a signed-in scenario.
 * @param seedGuestSession The module's own guest seed — the owner boot
 * recordings and the store's guest session, with no client signed in —
 * called only for a `@signed-out` scenario.
 */
export async function seedSessionFor(
  scenario: FeatureScenario,
  seedClientSession: () => Promise<unknown>,
  seedGuestSession: () => Promise<unknown>
): Promise<void> {
  if (includes(scenario.tags, SIGNED_OUT_TAG)) {
    await seedGuestSession();
    return;
  }
  await seedClientSession();
}
