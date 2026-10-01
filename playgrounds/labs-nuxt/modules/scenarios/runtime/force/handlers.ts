// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/handlers
 * @description The msw handler list a forced page is armed with — the endpoints
 * of the subject this module's own `.feature` declares, and nothing else
 * (`AC8.3`). A request outside that subject matches no handler here, and one
 * that matches a handler but no recording is passed through, so either way it
 * reaches staging untouched under `start({ onUnhandledRequest: "bypass" })`.
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
import {
  captureGap,
  handlersFor,
  normalizeRecording
} from "@upmind-automation/test-fixtures/fixture-handlers";
import { corpusCapabilities } from "./capabilities";
import {
  runtimeCorpus,
  runtimeFeature,
  runtimeRecordsScenarios
} from "./corpus";
import { PENDING, presetAnswer } from "./presets";
import { moduleRoutes } from "./routes";
import { isUndefined, map } from "lodash-es";
import type { CorpusBodies } from "./corpus";
import type { RecordedFixture } from "./corpus.source.types";
import type { ForcePreset } from "../composables/useForcedState.types";
import type { ReplayTiming } from "@upmind-automation/test-fixtures/fixture-handlers";
import type { ApiFixtureV3 } from "@upmind-automation/test-fixtures/types";
import type { HttpHandler, HttpResponseResolver, JsonBodyType } from "msw";

// -----------------------------------------------------------------------------

function presetResolver(
  preset: ForcePreset,
  bodies: CorpusBodies,
  failure: RecordedFixture | undefined
): HttpResponseResolver {
  return async ({ request }) => {
    const url = new URL(request.url);
    // What the page sent, read once: it picks the recording of the same write.
    const sent = await request
      .clone()
      .json()
      .catch(() => undefined);
    const answer = presetAnswer(
      preset,
      bodies,
      request.method,
      url,
      failure,
      sent
    );

    // Never settles, so the request stays in flight and the surface holds the
    // loading state it renders while one is — msw's own recipe for a request
    // that gets no answer.
    if (answer === PENDING) return delay("infinite");
    if (!answer) return passthrough();

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
 * The handlers a preset is armed with. `bodies` and `feature` default to the
 * armed module's — the `ESC6` seam's, once it has one — and are injectable so
 * the same list is provable against the committed artefacts before that ruling
 * lands. They are one module's PAIR: the recordings supply the paths, the
 * feature decides which of them that module owns, so passing one without the
 * other arms a corpus against another module's declaration.
 *
 * With no corpus there is nothing recorded to answer with, so the list is empty
 * and every request reaches the real service: forcing degrades to Live rather
 * than to an invented body (`S13`).
 */
export function createForceHandlers(
  preset: ForcePreset,
  bodies: CorpusBodies | undefined = runtimeCorpus(),
  feature: string = runtimeFeature()
): HttpHandler[] {
  if (!bodies) return [];

  // The module's OWN refusal, measured off the recordings it was handed rather
  // than named here (FE-3113).
  const { failure } = corpusCapabilities(bodies);

  const resolve = presetResolver(preset, bodies, failure);

  return map(moduleRoutes(feature, bodies), route => http.all(route, resolve));
}

/**
 * What a TRACK of a module that records its scenarios one by one (FE-3145) is
 * armed with before its first scene: a wall over the module's own subject, and
 * nothing else. Each scene arms its own step's answers in front of it
 * (`createStepHandlers`), so a request to the subject that no step of the
 * scenario recorded is a capture gap — a network error, never a guess and
 * never staging — and is pushed onto `gaps`, so the scene fails naming it.
 * Empty for a module that does not record its scenarios.
 *
 * @param gaps Where each capture gap is recorded.
 */
export function createScenarioWall(
  gaps: string[],
  bodies: CorpusBodies | undefined = runtimeCorpus(),
  feature: string = runtimeFeature()
): HttpHandler[] {
  if (!bodies || !runtimeRecordsScenarios()) return [];

  return map(moduleRoutes(feature, bodies), route =>
    http.all(route, ({ request }) => {
      gaps.push(captureGap(request));
      return HttpResponse.error();
    })
  );
}

/**
 * The answers ONE scenario step recorded, as handlers a scene arms in front of
 * every step before it (FE-3145). The matching is the node lanes' own
 * (`handlersFor`), so a step is answered in the labs exactly as its replay
 * test answers it.
 *
 * @param fixtures The step's recordings, keyed by fixture name.
 * @param timing The replayed scenario's answer timing; absent answers at once.
 */
export function createStepHandlers(
  fixtures: Record<string, RecordedFixture>,
  timing?: ReplayTiming
): HttpHandler[] {
  return handlersFor(
    map(fixtures, (fixture, name) =>
      normalizeRecording(fixture as unknown as ApiFixtureV3, name)
    ),
    timing
  );
}
