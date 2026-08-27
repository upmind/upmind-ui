// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/capabilities
 * @description Which forced states a module can be put into. The module's
 * committed `.feature` DECLARES them (operator ruling, 2026-08-27); the
 * recordings are evidence serving that declaration, never the authority over it.
 *
 * The direction of authority is the whole of FE-3113. An earlier draft let the
 * corpus decide, which silently removed a button whenever a capture had not
 * happened — the module's spec overruled by whatever sat on disk. Here a
 * declared preset the corpus cannot answer stays OFFERED and is reported by
 * {@link captureGaps} as a gap, so missing evidence reads as missing evidence
 * rather than as absent capability (`AC5`).
 *
 * `FORCE_URL_PRESETS` stays the master vocabulary. {@link declaredPresets}
 * FILTERS it; nothing here re-spells it, so a preset added to the vocabulary is
 * one this file must be taught to read rather than one it silently drops.
 */

import { FORCE_URL_PRESETS } from "../composables/useForcedState.types";
import {
  filter,
  find,
  isArray,
  isEmpty,
  get,
  toUpper,
  values
} from "lodash-es";
import type { CorpusCapabilities } from "./capabilities.types";
import type { RecordedFixture } from "./corpus.source.types";
import type { ForceUrlPreset } from "../composables/useForcedState.types";

// -----------------------------------------------------------------------------

/** At or above it the server refused; below it the exchange succeeded. */
const REFUSED_FROM = 400;

function isRead(fixture: RecordedFixture): boolean {
  return toUpper(fixture.request.method) === "GET";
}

function isRefusal(fixture: RecordedFixture): boolean {
  return fixture.response.status >= REFUSED_FROM;
}

/** A read that came back with rows — the only recording `empty` can subtract from. */
function isCollectionRead(fixture: RecordedFixture): boolean {
  return (
    isRead(fixture) &&
    !isRefusal(fixture) &&
    isArray(get(fixture.response, ["body", "data"]))
  );
}

// -----------------------------------------------------------------------------

/**
 * What EVIDENCE `bodies` holds — which declared presets the corpus can actually
 * be served from. This measures the recordings only; what a module OFFERS is
 * {@link declaredPresets}' answer, and a capability false here is a capture gap
 * rather than a withdrawn button.
 *
 * The failure carried back is the module's OWN refusal, preferred as a WRITE
 * because that is the half `error-action` is named for.
 *
 * Both error states require a RECORDED REFUSAL. A refusal is a real response —
 * a status and a body staging actually sent — and nothing is authored to fake
 * one (`S13`). That is why `client-email-history` — 15 reads, not one a refusal
 * — reports `error-collection` as a gap while still offering it: its `.feature`
 * declares the errored state, and only the capture is missing.
 *
 * @param bodies One module's recordings, keyed by fixture name.
 */
export function corpusCapabilities(
  bodies: Record<string, RecordedFixture>
): CorpusCapabilities {
  const fixtures = values(bodies);
  const refusals = filter(fixtures, isRefusal);

  const failedWrite = find(refusals, fixture => !isRead(fixture));
  const failure = failedWrite ?? refusals[0];

  return {
    canEmpty: !!find(fixtures, isCollectionRead),
    canLoading: !isEmpty(fixtures),
    canErrorCollection: !!failure,
    canErrorAction: !!failedWrite,
    failure
  };
}

/**
 * A feature declaring the three read states — the sentence every module's
 * "Know whether my list is loading, empty, or errored" scenario is written in.
 */
const DECLARES_READ_STATES = /loading,\s*empty,\s*or\s*errored/i;

/**
 * A feature declaring a rejected MUTATION, not merely a refused read. This is
 * the one distinction that separates the two modules the ruling names:
 * `client-email` says "forced read or mutation" and earns `error-action`;
 * `client-email-history` says "forced read" alone and does not.
 */
const DECLARES_MUTATION = /forced\s+read\s+or\s+mutation/i;

/**
 * The presets a module's committed `.feature` DECLARES, in the vocabulary's own
 * order. A feature naming no forced states declares none, which leaves its page
 * Live (`S12`).
 *
 * Read off the spec's prose, never off the corpus: whether the evidence to serve
 * a declared preset exists is {@link captureGaps}' question, and a missing
 * capture never narrows this set.
 *
 * @param feature The module's committed `.feature` text.
 */
export function declaredPresets(feature: string): readonly ForceUrlPreset[] {
  if (!DECLARES_READ_STATES.test(feature)) return [];

  const declaresMutation = DECLARES_MUTATION.test(feature);

  return filter(FORCE_URL_PRESETS, preset =>
    preset === "error-action" ? declaresMutation : true
  );
}

/**
 * The declared presets `bodies` cannot honestly answer — named loudly so a
 * capture that never happened reads as missing EVIDENCE rather than as absent
 * capability (`AC5`). The preset stays offered either way; this reports, it
 * never subtracts.
 *
 * @param declared What the module's `.feature` declares.
 * @param bodies That module's own recordings, keyed by fixture name.
 */
export function captureGaps(
  declared: readonly ForceUrlPreset[],
  bodies: Record<string, RecordedFixture>
): readonly ForceUrlPreset[] {
  const caps = corpusCapabilities(bodies);

  const answerable: Record<ForceUrlPreset, boolean> = {
    empty: caps.canEmpty,
    loading: caps.canLoading,
    "error-action": caps.canErrorAction,
    "error-collection": caps.canErrorCollection
  };

  return filter(declared, preset => !answerable[preset]);
}
