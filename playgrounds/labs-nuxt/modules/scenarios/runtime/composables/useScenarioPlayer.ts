// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useScenarioPlayer
 * @description The page's TRANSPORT: it arms a track, runs that track's scenes
 * against the live world the page renders, and keeps the playhead in the url so
 * every pane reads the same scene (design §3.1, `AC2.5`/`AC2.7`).
 *
 * Two rules carry the whole safety of replay, and both live in the arm:
 *
 * 1. **The `replay` preset is armed BEFORE the first scene runs.** Scenes are
 *    imperative calls on a live composable — `remove`, `ensure` and
 *    `setDefault` among them — and stepping back replays from scene 0, so an
 *    arm that lands late writes to STAGING on the first scrub (`AC2.6`,
 *    design §7.2).
 * 2. **A track is never played against a cell the page is not showing.** A
 *    track declaring a scope the page is not on takes the page THERE first (a
 *    scope segment, so the page remounts per `P1-R2` and mounts that cell
 *    itself) and arms from the url on the other side. `world.boot` therefore
 *    only ever runs at the scope already on screen — the branch T4.3 adopts —
 *    and the client-emails page's staff track, which declares one the page is not on, can
 *    no longer `destroy()` the rendered cell and drive an invisible instance
 *    (design §3.1 ruling 2, §7.1).
 *
 * Backwards is REPLAY, not time-travel: nothing can un-fire a step, so `prev`
 * and `seek` re-run from scene 0, which is deterministic only because the
 * corpus is fixed (design §3.1 ruling 1).
 *
 * The url is the state (`S11`): `track=` is this composable's INPUT rather than
 * a mirror of it, so a pasted link arms, `scene=` resumes at that scene, and an
 * armed track survives the remount rule 2 causes.
 *
 * One player per page, created where the port is (`S19` — scenarios are
 * page-scoped): two would each own `track=` and fight over it.
 */

import { computed, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { resolveSelfActor } from "@upmind-automation/headless";
import { SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import {
  buildScopePath,
  useActorScope,
  useContextScope
} from "../../../../app/composables/scope";
import { usePlaygroundUrlState } from "../../../../app/composables/usePlaygroundUrlState";
import { SCENARIO_ROUTE_META_KEY } from "../scenario.constants";
import { useForcedState } from "./useForcedState";
import {
  SCENARIO_PLAYER_STATUS,
  SCENE_UNPLAYED
} from "./useScenarioPlayer.types";
import { useScenarioWorld } from "./useScenarioWorld";
import {
  assign,
  cloneDeep,
  find,
  get,
  isEqual,
  isNumber,
  keys,
  mapValues,
  noop,
  omit,
  size
} from "lodash-es";
import type { FeatureTrack } from "./useFeatureTracks.types";
import type {
  ScenarioPlayerSource,
  ScenarioPlayerStatus,
  UseScenarioPlayer
} from "./useScenarioPlayer.types";
import type { PlaygroundUrlState } from "../../../../app/composables/usePlaygroundUrlState.types";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type {
  ScopeActor,
  WorldScope
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The beat a played scene holds the screen for. Playback is the whole point of
 * the transport (`AC2.5`): without it `play` runs the track to its end inside
 * one frame, so no scene is ever seen and the pause state cannot be reached.
 */
const SCENE_DWELL_MS = 1200;

/**
 * The scope the page is showing, as the port that renders it was BUILT — the
 * actor resolved through the scope builder's own resolver, never a second
 * reading of what `self` means.
 */
function routeScope(): () => WorldScope {
  const actor = useActorScope();
  const context = useContextScope();

  // The harness's `ScopeActor` mirrors the headless enum over its vue-free
  // source and shares its wire values (`useScenarioWorld`).
  return () => ({
    actor: resolveSelfActor(actor.value) as ScopeActor,
    context: context.value
  });
}

/**
 * A router push of a track's scope path, carrying the query — and with it the
 * `track=` that arms on the other side — through the navigation (design §7.3).
 */
function routeNavigator(
  url: PlaygroundUrlState
): (scope: WorldScope) => Promise<void> {
  const route = useRoute();
  const router = useRouter();

  return async scope => {
    const path = buildScopePath({
      page: get(route.meta, SCENARIO_ROUTE_META_KEY, "") as string,
      brandId: get(route.params, "brandIdOrOrg") as string | undefined,
      actor: scope.actor as ScopeActorTypes,
      context: scope.context
    });

    await router.push(url.preserveQuery(path));
  };
}

// -----------------------------------------------------------------------------

/**
 * Builds the page's transport over its playlist.
 *
 * @param source The page's tracks, its request state, and the seams the player
 * drives — each defaulted to the page's own.
 */
export function useScenarioPlayer(
  source: ScenarioPlayerSource
): UseScenarioPlayer {
  const url = source.url ?? usePlaygroundUrlState();
  const forced = source.forced ?? useForcedState();
  const world = source.world ?? useScenarioWorld();
  const pageScope = source.scope ?? routeScope();
  const navigate = source.navigate ?? routeNavigator(url);
  const dwell = source.dwell ?? SCENE_DWELL_MS;

  const armed = shallowRef<FeatureTrack | undefined>();
  const playhead = ref(SCENE_UNPLAYED);
  const status = ref<ScenarioPlayerStatus>(SCENARIO_PLAYER_STATUS.LIVE);
  const jobs = ref(0);
  const failure = shallowRef<unknown>();

  const boot = source.criteria
    ? cloneDeep(source.criteria.model.value)
    : undefined;

  let queue: Promise<void> = Promise.resolve();

  // The url track this player has already acted on. A foreign-scope arm leaves
  // `track=` set while it navigates, so without this the watcher below would
  // read its own write back and push a second time.
  let handled: string | undefined;

  /**
   * Chained, never raced: a control pressed mid-scene runs after it, and a
   * failed job never poisons the next.
   *
   * A throw is CAUGHT into {@link UseScenarioPlayer.failure} and `FAILED`
   * rather than handed back: every caller here discards this promise, so an
   * uncaught rejection is an `unhandledrejection` in the console and a bar that
   * simply goes quiet (`S14`).
   */
  function enqueue(job: () => Promise<void>): Promise<void> {
    jobs.value++;
    const settle = (): void => {
      jobs.value--;
    };

    const run = queue
      .catch(noop)
      .then(() => {
        failure.value = undefined;
        return job();
      })
      .catch((reason: unknown) => {
        failure.value = reason;
        status.value = SCENARIO_PLAYER_STATUS.FAILED;
      });

    queue = run.then(settle, settle);

    return run;
  }

  /**
   * The criteria back to boot state, TOTALLY. The port's `set` merges at BRANCH
   * level, so a payload that merely omits a branch leaves that branch standing —
   * and an unfiltered boot model carries no `filters` branch at all, the query
   * criteria compacting empty containers out of the model it publishes. Handing
   * back the boot state alone therefore cannot unwind a filter a scene applied:
   * every live branch the boot state does not carry is named here and cleared.
   */
  function resetCriteria(): void {
    if (!source.criteria || !boot) return;

    const cleared: Record<string, unknown> = mapValues(
      omit(source.criteria.model.value, keys(boot)),
      () => undefined
    );

    source.criteria.set(assign(cleared, cloneDeep(boot)));
  }

  /**
   * The scope a track declares that the page is NOT showing, which is what the
   * page must be taken to before the track may run a single scene. Only the
   * actor and the context decide, because they are what the port is built from;
   * a track booting `self` declares whatever actor the page resolves to, so it
   * is never foreign.
   */
  function foreignScope(track: FeatureTrack): WorldScope | undefined {
    const declared = track.scope;
    if (!declared || declared.actor === SCOPE_ACTOR.SELF) return undefined;

    const page = pageScope();
    const shown =
      declared.actor === page.actor && isEqual(declared.context, page.context);

    return shown ? undefined : declared;
  }

  /**
   * A track with an unmatched scene refuses to play, and so does every track
   * while the corpus cannot answer: replaying against staging would re-fire
   * scenes that WRITE (`AC2.6`).
   */
  function canArm(track: FeatureTrack): boolean {
    return forced.isAvailable && track.isPlayable;
  }

  async function armTrack(track: FeatureTrack, resume?: number): Promise<void> {
    if (!canArm(track)) return;
    handled = track.slug;

    // Written first: the link is what carries the track across the remount a
    // scope navigation causes.
    url.write({ track: track.slug, scene: undefined });

    const foreign = foreignScope(track);
    if (foreign) return navigate(foreign);

    armed.value = track;
    playhead.value = SCENE_UNPLAYED;
    status.value = SCENARIO_PLAYER_STATUS.ARMED;

    await forced.arm("replay");
    resetCriteria();

    if (isNumber(resume) && resume > SCENE_UNPLAYED) await replayTo(resume);
  }

  async function runScene(index: number): Promise<void> {
    const scene = get(armed.value?.scenes, index);
    if (!scene) return;

    await scene.run(world);

    playhead.value = index;
    url.scene.value = index;
    if (status.value !== SCENARIO_PLAYER_STATUS.PLAYING)
      status.value = SCENARIO_PLAYER_STATUS.PAUSED;
  }

  async function replayTo(index: number): Promise<void> {
    playhead.value = SCENE_UNPLAYED;
    url.scene.value = undefined;
    resetCriteria();
    // Re-armed, not merely re-run: the scenes about to fire again are the ones
    // that already moved the replay's collection, so it goes back to the
    // recording first or the second pass would land on the first pass's state.
    await forced.arm("replay");

    for (let scene = 0; scene <= index; scene++) await runScene(scene);
  }

  async function play(): Promise<void> {
    if (!armed.value) return;

    const last = size(armed.value.scenes) - 1;
    status.value = SCENARIO_PLAYER_STATUS.PLAYING;

    try {
      while (
        status.value === SCENARIO_PLAYER_STATUS.PLAYING &&
        playhead.value < last
      ) {
        await runScene(playhead.value + 1);
        if (
          status.value !== SCENARIO_PLAYER_STATUS.PLAYING ||
          playhead.value >= last
        )
          break;
        await new Promise<void>(resolve => setTimeout(resolve, dwell));
      }
    } finally {
      if (status.value === SCENARIO_PLAYER_STATUS.PLAYING)
        status.value = SCENARIO_PLAYER_STATUS.PAUSED;
    }
  }

  async function disarm(): Promise<void> {
    armed.value = undefined;
    playhead.value = SCENE_UNPLAYED;
    status.value = SCENARIO_PLAYER_STATUS.LIVE;
    url.write({ track: undefined, scene: undefined });

    // The world is deliberately NOT disposed: the port it holds IS the page's
    // own cached cell, so disposing it would `destroy()` the rendered surface
    // (design §7.1).
    await forced.disarm();
    resetCriteria();
  }

  const requested = computed(() =>
    find(source.tracks, ["slug", url.track.value])
  );

  watch(
    requested,
    next => {
      if (!next) {
        handled = undefined;
        if (armed.value) void enqueue(disarm);
        return;
      }
      if (next === armed.value || next.slug === handled) return;

      // Read before the arm writes: a pasted link's own scene is what the
      // player resumes at.
      const resume = url.scene.value;
      void enqueue(() => armTrack(next, resume));
    },
    { immediate: true }
  );

  return {
    track: computed(() => armed.value),
    status: computed(() => status.value),
    playhead: computed(() => playhead.value),
    isBusy: computed(() => jobs.value > 0),
    failure: computed(() => failure.value),
    isAvailable: forced.isAvailable,

    arm: track => enqueue(() => armTrack(track)),
    play: () => enqueue(play),
    pause: () => {
      if (status.value === SCENARIO_PLAYER_STATUS.PLAYING)
        status.value = SCENARIO_PLAYER_STATUS.PAUSED;
    },
    next: () => enqueue(() => runScene(playhead.value + 1)),
    prev: () => enqueue(() => replayTo(playhead.value - 1)),
    seek: index => enqueue(() => replayTo(index)),
    stop: () => {
      // Flipped before the job is queued so a running `play` stops at the scene
      // it is on rather than after the whole track.
      status.value = SCENARIO_PLAYER_STATUS.LIVE;
      return enqueue(disarm);
    },
    whenSettled: () => queue
  };
}
