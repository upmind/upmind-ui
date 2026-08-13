// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/handlers
 * @description The msw handler list a forced page is armed with — this module's
 * OWN endpoints and nothing else (`AC8.3`): the collection, one address, and the
 * verification send. Everything else the app does — brand, settings, config, the
 * session boot — matches no handler here, which is what leaves it free to reach
 * staging untouched under `start({ onUnhandledRequest: "bypass" })`.
 *
 * `msw` is named HERE rather than in the composable that arms it, because this
 * module is reached only through that composable's dynamic import: a bare load
 * resolves neither, registers no worker and stays Live (`S12` · `AC8.1`).
 *
 * Every served body is a recorded one — the answers are `presets.ts`'s over the
 * resolver's corpus, and no response literal appears in this file (`S13` ·
 * `AC8.5`). While `ESC6` is unruled the seam carries no recordings at all, so
 * the list is EMPTY: an armed worker with no handlers intercepts nothing and the
 * page stays Live, which is the only honest answer to a state nothing was
 * recorded for.
 */

import { HttpResponse, delay, http, passthrough } from "msw";
import { createCorpusSession, runtimeCorpus } from "./corpus";
import { PENDING, presetAnswer } from "./presets";
import { MODULE_ROUTES } from "./routes";
import { isUndefined, map } from "lodash-es";
import type { CorpusSession } from "./corpus";
import type { CorpusBodies } from "./corpus.source.types";
import type { ForcePreset } from "../composables/useForcedState.types";
import type { HttpHandler, HttpResponseResolver, JsonBodyType } from "msw";

// -----------------------------------------------------------------------------

/** Below it the server accepted the write, so the collection moved with it. */
const REFUSED_FROM = 400;

function presetResolver(
  preset: ForcePreset,
  session: CorpusSession
): HttpResponseResolver {
  return async ({ request }) => {
    const url = new URL(request.url);
    const answer = presetAnswer(preset, session.bodies(), request.method, url);

    // Never settles, so the request stays in flight and the surface holds the
    // loading state it renders while one is — msw's own recipe for a request
    // that gets no answer.
    if (answer === PENDING) return delay("infinite");
    if (!answer) return passthrough();

    // The answer is served as recorded and the collection moves AFTER it: the
    // read the module fires next is the one that shows the write landed, which
    // is the whole of "the surface follows the scene" (`R7-4`). A refusal lands
    // nothing — `error-action` forces exactly that. The request's own body
    // rides along so what lands is the write the wire accepted.
    if (answer.status < REFUSED_FROM)
      session.apply(
        request.method,
        url,
        await request
          .clone()
          .json()
          .catch(() => undefined)
      );

    // A recording served with its sentence withheld carries no body at all, so
    // the status is the whole answer — `json(undefined)` would put the string
    // `undefined` on the wire for the caller to parse.
    return isUndefined(answer.body)
      ? new HttpResponse(null, { status: answer.status })
      : HttpResponse.json(answer.body as JsonBodyType, {
          status: answer.status
        });
  };
}

// -----------------------------------------------------------------------------

/**
 * The handlers a preset is armed with. `bodies` defaults to the runtime corpus —
 * the `ESC6` seam's, once it has one — and is injectable so the same list is
 * provable against the committed recordings before that ruling lands.
 *
 * With no corpus there is nothing recorded to answer with, so the list is empty
 * and every request reaches the real service: forcing degrades to Live rather
 * than to an invented body (`S13`).
 */
export function createForceHandlers(
  preset: ForcePreset,
  bodies: CorpusBodies | undefined = runtimeCorpus()
): HttpHandler[] {
  if (!bodies) return [];

  // One session per LIST: re-arming is how a replay goes back to the recording,
  // so the mutations a track played never outlive the arm that played them.
  const resolve = presetResolver(preset, createCorpusSession(bodies));

  return map(MODULE_ROUTES, route => http.all(route, resolve));
}
