// -----------------------------------------------------------------------------
/**
 * @module testing/corpus-replay
 * @description A module's recorded corpus, served by the ONE shared replay
 * (`@upmind-automation/test-fixtures/corpus-replay`) — the same fake API the
 * labs page arms. A headless replay test installs this and nothing else for
 * the module's own routes: no per-module handler, no hand-approximated search,
 * no echo written twice. What the page would be answered, the test is answered.
 */

import {
  createCorpusReplayHandlers,
  createCorpusSession
} from "@upmind-automation/test-fixtures/corpus-replay";
import { recordedBodies } from "./fixtures";
import { keys, map, zipObject } from "lodash-es";
import type {
  CorpusBodies,
  RecordedFixture
} from "@upmind-automation/test-fixtures/corpus-replay";

// -----------------------------------------------------------------------------

/** Every recording under `<module>/__tests__/fixtures`, keyed by fixture name. */
export async function loadModuleCorpus(
  moduleName: string
): Promise<CorpusBodies> {
  const loaders = recordedBodies[moduleName];

  if (!loaders)
    throw new Error(
      `corpus-replay: "${moduleName}" publishes no recordings under __tests__/fixtures`
    );

  const names = keys(loaders);
  const fixtures = await Promise.all(map(names, name => loaders[name]()));

  return zipObject(names, fixtures as RecordedFixture[]);
}

/**
 * Arms `server` with the shared replay over `bodies`, one session for the
 * test: what a scenario writes is what its next read sees.
 */
export function installCorpusReplay(
  server: { use: (...handlers: unknown[]) => void } | undefined,
  bodies: CorpusBodies,
  routes?: readonly string[]
): void {
  server?.use(
    ...createCorpusReplayHandlers(createCorpusSession(bodies), routes)
  );
}
