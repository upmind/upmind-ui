// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useFeatureTracks
 * @description The page's playlist: the module's own feature parsed into
 * TRACKS whose scenes are bound to the step catalog's handlers (design §3.1).
 *
 * The parse and the match are the HARNESS's own — `parseFeatureScenarios` and
 * `createStepMatcher` are the two functions `createTraceabilityCheck` runs — so
 * a step that traces in the Playwright lane plays here, and there is no second
 * parser, no second catalog and no second copy of the scenario logic.
 *
 * The module's ONE feature holds its not-yet-driveable scenarios too, so the
 * playlist is the DRIVEABLE subset: a scenario none of whose own steps the
 * catalog matches is a capability written down and not yet driven, and never
 * becomes a track. A scenario matched only in PART still becomes one, carrying
 * the failure out loud (`isPlayable` false, and the scene's own `run` refuses)
 * — a demo that skips what it cannot run lies about what the module did.
 *
 * The playlist text arrives through the corpus seam (`force/corpus.source.ts`),
 * which is empty until `ESC6` is ruled — so the playlist is empty today and the
 * page is Live-only, which is the state it boots into anyway (`S12`).
 */

import {
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "@upmind-automation/headless";
import {
  createStepMatcher,
  parseFeatureScenarios,
  STEP_KIND
} from "@upmind-automation/scenario-harness";
import {
  drop,
  every,
  filter,
  forEach,
  kebabCase,
  map,
  noop,
  some,
  takeWhile,
  toString
} from "lodash-es";
import type {
  FeatureTrack,
  FeatureTracksSource,
  TrackScene,
  UseFeatureTracks
} from "./useFeatureTracks.types";
import type {
  FeatureScenario,
  FeatureStep,
  StepMatcher,
  World,
  WorldScope
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** Every failure here is a harness-authoring mistake, surfaced as the module error shape. */
function fail(message: string): never {
  throw new DetailedError(
    `scenario tracks: ${message}`,
    responseCodes.Bad_Request,
    ErrorOrigin.Headless
  );
}

function toScene(step: FeatureStep, matcher: StepMatcher): TrackScene {
  const matched = matcher.match(step.text);

  return {
    ...step,
    isMatched: !!matched,
    // The matched handler as its own source, so the Code pane can print the code
    // a scenario actually EXECUTES rather than a call shape invented for display
    // (`R6-20`). Nothing else can say it: a handler is an opaque closure, and its
    // own text is the only honest account of what a step does.
    args: matched?.args ?? [],
    source: matched ? toString(matched.def.handler) : undefined,
    async run(world) {
      if (!matched) fail(`no step matches "${step.text}" (line ${step.line})`);

      await matched.def.handler(world, ...matched.args);
    }
  };
}

/**
 * The scope a track declares, read off its own arrangement: a `Given` declares
 * its scope by BOOTING at it, so the leading arrangement is replayed against a
 * world that records that boot and runs nothing else. Nothing else can tell us
 * — a handler is an opaque closure, and a scope tag vocabulary does not exist
 * in the feature — and reading it here keeps the runtime free of any one
 * scenario's knowledge.
 */
function declaredScope(scenes: readonly TrackScene[]): WorldScope | undefined {
  let booted: WorldScope | undefined;

  const probe: World = {
    boot: async (_key, scope) => {
      booted = scope;
    },
    fire: async () => {},
    expectMeta: async () => {},
    expectContext: async () => {},
    dispose: async () => {}
  };

  forEach(takeWhile(scenes, ["kind", STEP_KIND.GIVEN]), scene => {
    // A boot-first handler calls `world.boot` before it awaits anything, so the
    // probe holds the scope by the time `run` hands its promise back — which is
    // what lets the bar and the player read `scope` synchronously. The promise
    // itself is inert against a world that runs nothing, and an unmatched scene
    // refusing is exactly the case `isPlayable` already carries.
    void scene.run(probe).catch(noop);
  });

  return booted;
}

/**
 * `track=` addresses a track by its name (design §3.4), and an Examples row
 * whose name carries no placeholder repeats its outline's — so a repeat takes
 * an ordinal rather than two tracks answering to one link.
 */
function uniqueSlug(name: string, taken: Set<string>): string {
  const base = kebabCase(name) || "track";

  let slug = base;
  for (let ordinal = 2; taken.has(slug); ordinal++) slug = `${base}-${ordinal}`;

  taken.add(slug);
  return slug;
}

function toTrack(
  scenario: FeatureScenario,
  matcher: StepMatcher,
  taken: Set<string>
): FeatureTrack {
  const scenes = map(scenario.steps, step => toScene(step, matcher));

  return {
    name: scenario.name,
    slug: uniqueSlug(scenario.name, taken),
    tags: scenario.tags,
    line: scenario.line,
    scope: declaredScope(scenes),
    scenes,
    isPlayable: every(scenes, "isMatched")
  };
}

// -----------------------------------------------------------------------------

/**
 * Parses a page's declared playlist into playable tracks.
 *
 * @param source The feature text and the module's step catalog — the scenario
 * declaration's own `tracks` channel is one.
 */
export function useFeatureTracks(
  source: FeatureTracksSource
): UseFeatureTracks {
  const matcher = createStepMatcher(source.catalog);
  const taken = new Set<string>();

  const isDriven = (scenario: FeatureScenario): boolean =>
    some(drop(scenario.steps, scenario.backgroundStepCount), step =>
      Boolean(matcher.match(step.text))
    );

  return {
    tracks: map(
      filter(parseFeatureScenarios(source.feature), isDriven),
      scenario => toTrack(scenario, matcher, taken)
    ),
    malformedStepDefs: matcher.malformedStepDefs
  };
}
