// @vitest-environment happy-dom
/**
 * @module scenarios/runtime/components/__tests__/forced-surface.client-notifications.spec
 * @description FE-3113 `AC3` · `AC4` — the client-notifications page under each
 * preset its own recordings can answer. The claims, and why they are read off
 * the rendered page rather than off `presetAnswer`, live in
 * `forced-surface.harness.ts`.
 *
 * One module per file: each module's replay lifecycle installs its own request
 * interceptor over the same globals, so two in one file leaves the second one's
 * server answering the first one's page.
 */

import declaration from "../../../useClientNotifications/client-notifications.scenario";
import { proveForcedSurface } from "./forced-surface.harness";

// -----------------------------------------------------------------------------

await proveForcedSurface(declaration);
