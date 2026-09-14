// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/corpus
 * @description The ONE resolver over a module's recorded corpus — the param
 * branching (`filter[col|op]`, `order`, `limit`/`offset` over the recorded rows)
 * both lanes call: the force worker's handlers and the browser lane's
 * `page.route` adapter. Two copies of the branching would be two behaviours. One
 * copy is also what makes a filter/sort read-back falsifiable — rows can only
 * narrow or reorder if the criteria reached the wire, so a client-side-only
 * filter leaves the served rows untouched.
 *
 * UN-PINNED (FE-3113). Every branch was `client-email`'s: a fixture-name union,
 * three email path regexes, and a boolean-column list naming that module's own
 * columns. All three are gone. What replaced them is the thing the recordings
 * already carried — each one states its own `request.method`, `request.path` and
 * `response`, so the resolver MATCHES rather than knows: an incoming request
 * finds the recording captured at the same endpoint shape and method, and the
 * criteria branching reads the OPERATOR out of `filter[col|op]` instead of a
 * list of that module's columns.
 *
 * Bodies arrive as an ARGUMENT, never as bytes this module holds: app runtime's
 * source is the `ESC6` seam (`runtimeCorpus()`), the browser lane's is its own
 * lawful read of the same committed files. No headless test-kit specifier is
 * named here — eslint 8g reds one outside the four test-lane globs, and `lint`
 * is a gate — and no response literal appears either: every served status and
 * body is the recording's own (`S13` · `AC8.5`).
 *
 * Browser-safe by construction: no `node:fs`, no `node:path`.
 */

import {
  featureTextFor,
  getCorpusBodies,
  isModuleResolved,
  loadCorpusBodies
} from "./corpus.source";
import { armsForceableSurface } from "./routes";
import type { CorpusBodies } from "@upmind-automation/test-fixtures/corpus-replay";

// The replay itself — resolver, rows, session, handlers — is the ONE shared
// implementation in `@upmind-automation/test-fixtures/corpus-replay`; this
// module keeps only the page's seam (which module is armed) and re-exports the
// replay under the names the runtime always imported from here.
export {
  corpusRows,
  createCorpusReplayHandlers,
  createCorpusSession,
  resolveCorpusAbsence,
  resolveCorpusRefusal,
  resolveCorpusRequest,
  servedRows
} from "@upmind-automation/test-fixtures/corpus-replay";
export type {
  CorpusBodies,
  CorpusResponse,
  CorpusSession,
  WireEnvelope,
  WireRecord
} from "@upmind-automation/test-fixtures/corpus-replay";

// -----------------------------------------------------------------------------

/**
 * The module a page has armed on. Set by {@link armCorpusModule} before a
 * preset can reach the handlers, so the transport-free resolver keeps taking its
 * bodies as an ARGUMENT and only the runtime-default lookup needs to know which
 * module the page is.
 *
 * ONE at a time by construction: there is one worker per tab and one scenario
 * per page, so a second module armed is the first one released.
 */
let armedModule: string | undefined;

// -----------------------------------------------------------------------------

/**
 * Loads `module`'s recordings and makes them the corpus {@link runtimeCorpus}
 * answers with. Awaited by the page that resolved the scenario, BEFORE a preset
 * can arm — the seam's loaders are lazy, so a synchronous read of an unloaded
 * module would find nothing and force would silently degrade to Live.
 *
 * A module the seam does not reach arms nothing and leaves the page Live, which
 * is the state it boots into anyway (`S12`). So does a module the seam reaches
 * but whose declared subject owns no read to picture — an action-only flow
 * ({@link armsForceableSurface}); it has no state to force, so it never arms.
 *
 * @param module The module whose recordings this page forces over.
 */
export async function armCorpusModule(module: string): Promise<boolean> {
  if (!isModuleResolved(module)) return false;

  const bodies = await loadCorpusBodies(module);
  if (!bodies || !armsForceableSurface(featureTextFor(module), bodies))
    return false;

  armedModule = module;

  return true;
}

/**
 * The recorded bodies as APP RUNTIME may reach them, or `undefined` while no
 * module is armed or while `ESC6` is unruled — the seam throws rather than
 * improvise a body, so the guard is read here once and forcing simply has no
 * corpus to arm on. Live carries the page in the meantime (`S12`).
 *
 * @param module Which module's corpus, defaulting to the armed one.
 */
export function runtimeCorpus(
  module: string | undefined = armedModule
): CorpusBodies | undefined {
  if (!module || !isModuleResolved(module)) return undefined;

  return getCorpusBodies(module) as CorpusBodies | undefined;
}

/**
 * The armed module's committed `.feature` — the declaration that decides which
 * of its recorded paths are its own SUBJECT and which are chrome its capture run
 * happened to touch (`moduleRoutes`). It travels beside {@link runtimeCorpus}
 * because both answer for the module this page armed, and a corpus read against
 * another module's declaration would arm the wrong endpoints.
 *
 * A module no page has armed declares nothing, so nothing is armed (`S12`).
 *
 * @param module Which module's feature, defaulting to the armed one.
 */
export function runtimeFeature(
  module: string | undefined = armedModule
): string {
  return module ? featureTextFor(module) : "";
}
