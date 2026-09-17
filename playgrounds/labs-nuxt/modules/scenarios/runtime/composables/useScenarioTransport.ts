// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useScenarioTransport
 * @description The page's PLAYLIST, its forced-state offer and its ONE player,
 * in one place — everything `ScenarioBar` is handed and everything the forced
 * frame reads.
 *
 * ## Why it is a composable rather than host code
 * It was host code: the shared `ScenarioPlayground` built all of it inline, and
 * it was the only surface that could, so a module drawing its OWN page had no
 * scenario bar at all. `ScenarioBar` was already standalone — it takes
 * `{ player, tracks, states }` and nothing else — so the only thing keeping a
 * self-drawn page off the transport was this wiring's location, not its shape.
 *
 * Lifting it here rather than copying it is the whole point: a second copy is a
 * second behaviour, and the ordering below is load-bearing in ways a copy would
 * lose — the corpus arm is the barrier the forced-state handle holds its first
 * reconcile behind, the offer is measured before an unresolved `force=` slug may
 * disarm, and the player is created once per page (`S19`) because two would each
 * own `track=`.
 *
 * Every comment below is the ruling it came with; nothing here is new
 * behaviour. The one addition is that the world and the page scope are SEAMS
 * (both already `ScenarioPlayerSource` members), so a self-drawn page can hand
 * in the cell it already booted.
 */

import { computed, ref, watch } from "vue";
import { armCorpusModule, runtimeCorpus } from "../force/corpus";
import { featureTextFor, featureTracksFor } from "../force/corpus.source";
import { forcedStateGaps, offeredForcedStates } from "../force/offer";
import { presetRefusal } from "../force/presets";
import { useFeatureTracks } from "./useFeatureTracks";
import { useForcedState } from "./useForcedState";
import { useScenarioPlayer } from "./useScenarioPlayer";
import { isEmpty, map } from "lodash-es";
import type {
  ScenarioTransport,
  ScenarioTransportSource
} from "./useScenarioTransport.types";
import type { ForcedState } from "../force/states.types";

// -----------------------------------------------------------------------------

/**
 * Builds the page's transport over the module its declaration `tracks`.
 *
 * @param source The module, the booted port's request state and cache clear,
 * and the two seams a self-drawn page overrides.
 */
export function useScenarioTransport(
  source: ScenarioTransportSource
): ScenarioTransport {
  // `tracks` names the MODULE (`R6-37`); the seam hands back that module's own
  // committed playlist and the catalog that plays it, and a module it does not
  // reach leaves the page Live-only (`S12`).
  const trackedModule = source.module;

  const trackSource = trackedModule
    ? featureTracksFor(trackedModule)
    : undefined;

  const tracks = trackSource ? useFeatureTracks(trackSource).tracks : [];

  // The forced states THIS page offers: the ones its module's own `.feature`
  // declares (operator ruling, 2026-09-12), kept to those its own recordings can
  // answer — so a state with no evidence behind it is never offered and never
  // served from something authored (`S13`). Empty until the corpus lands, which
  // leaves the page Live in the meantime — the state it boots into anyway
  // (`S12`).
  const states = ref<ForcedState[]>([]);

  // Whether that offer has been MADE yet. Empty means "not measured" until this
  // turns, and disarming on a list nobody has filled in would drop a pasted link
  // before its own corpus had a chance to answer it.
  const isOffered = ref(false);

  // Read off the same recording the intercept answers a real write with, so the
  // row drawn refused and the request that would be refused say one thing.
  const refusal = ref<string | undefined>();

  // Arming is what loads the recordings — the seam's loaders are lazy — so both
  // the offer and the evidence check run after the corpus lands. It is also the
  // barrier the forced-state handle holds its first reconcile behind: a pasted
  // `force=` link arms in this same tick, and one that won the race would
  // register a worker with no handlers at all.
  const whenArmed = trackedModule
    ? armCorpusModule(trackedModule).then(armed => {
        const bodies = armed ? runtimeCorpus(trackedModule) : undefined;
        if (!bodies) return;

        const feature = featureTextFor(trackedModule);

        states.value = offeredForcedStates(feature, bodies);
        refusal.value = presetRefusal(bodies);
        isOffered.value = true;

        const gaps = forcedStateGaps(feature, bodies);

        if (!isEmpty(gaps))
          console.warn(
            `[force] ${trackedModule} declares states its own recordings cannot answer — a capture gap, not a missing capability:\n` +
              map(
                gaps,
                gap =>
                  `  - ${gap.title} [${gap.recipe.kind}/${gap.recipe.target}]`
              ).join("\n")
          );
      })
    : undefined;

  const player = useScenarioPlayer({
    tracks,
    criteria: source.criteria,
    world: source.world,
    scope: source.scope
  });

  // A replay is a PLAYBACK, so while a track is armed the page's own controls are
  // the script's (`R6-23`). It reads the armed TRACK rather than the player's
  // status: `FAILED` and `PAUSED` are still a track holding the surface, and only
  // Live — which is `stop()` — hands it back.
  const isReplaying = computed(() => !!player.track.value);

  // The frame reads the worker's own preset rather than the player's status: a
  // pasted `force=` link arms with no track at all, and only the handle knows
  // what is actually being served (`AC8.4`).
  //
  // The cache clear the arm ends on is the booted module's OWN, handed in because
  // forcing may learn no query key (FE-3113): `reset` is already bound to the
  // domain this module caches under, which neither the url nor a recorded path
  // spells. `reset` and not `invalidate` — the latter keeps the rows, so a forced
  // `loading` redrew the data it already had and a forced failure drew its error
  // above rows the read never returned. A module publishing none leaves the arm
  // swapping the transport alone.
  //
  // The module's NAME rides with them so leaving it disarms (FE-3113 R): the two
  // are one module's, and so is the preset.
  const moduleReset = source.reset;

  // Surfaced, never silent (`S14`): forcing swaps what the tab's NEXT request is
  // answered with, and a module that publishes no `reset` never asks again — so
  // every state this page offers would arm a worker nobody could see. The page
  // still offers them (the transport does change, and a manual refresh shows it),
  // but the reason the screen may not move is said out loud rather than left as a
  // dead control.
  if (trackedModule && !moduleReset)
    console.warn(
      `[force] ${trackedModule} publishes no \`reset\` action, so arming a forced state swaps the transport but the page keeps the answers it already holds — the state may not appear until the page is reloaded. Ship \`reset\` on the module's actions layer.`
    );

  const {
    disarm,
    preset,
    state: forcedState,
    requested,
    isSettling
  } = useForcedState({
    module: trackedModule,
    states,
    reset: moduleReset,
    whenArmed
  });

  // A forced state is a fact about THIS module's own feature and corpus. A slug
  // reached by a pasted url — or by a sidebar navigation that carried the query
  // across — names a state this page does not offer and nothing here can honestly
  // answer, so the page lands Live rather than armed on nothing. It is read after
  // the offer has been MEASURED: before that, an unresolved slug is a link whose
  // corpus has simply not landed yet (`AC8.2`).
  watch([requested, isOffered, forcedState], ([slug, measured, armed]) => {
    if (!measured || !slug || armed) return;
    void disarm();
  });

  // Gated on the preset: a row marked under any other is a failure nobody armed.
  const forcedRefusal = computed(() =>
    preset.value === "error-action" ? refusal.value : undefined
  );

  // A page mid-arm is no more the operator's to drive than one mid-replay, and
  // for the same reason (`R6-23`): the transport a write would answer through is
  // not yet the one the rows on screen came from. An ARMED forced state is a
  // replay too — the page is showing a state, not taking input — so it locks for
  // as long as it is armed; `Live` hands the page back.
  const isLocked = computed(
    () => isReplaying.value || isSettling.value || !!forcedState.value
  );

  return {
    tracks,
    featureText: trackSource?.feature,
    states,
    player,
    forcedState,
    forcedRefusal,
    isLocked
  };
}
