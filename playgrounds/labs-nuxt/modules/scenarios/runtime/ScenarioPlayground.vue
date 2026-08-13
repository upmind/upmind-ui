<template>
  <UpmLayout>
    <!-- The mocking glow is the WHOLE page's, not a box around the table
         (`R6-18`): what is faked is the page, and the outline it is drawn with
         reserves no space, so nothing below moves when a preset arms. -->
    <ForcedCanvas :preset="preset">
      <div class="space-y-6">
        <!-- A replay is not interactive (`R6-23`): with a track armed the page's
             own controls are the SCRIPT's, so both halves that own one are told
             so, and picking Live releases them in the same tick. -->
        <PageHeader
          :name="scenario.route"
          :actions="collectionActions"
          :locked="isReplaying"
        />

        <ScenarioBar :player="player" :tracks="tracks" />

        <!-- The collection's own actions reach the header through the surface
             that owns the editor they open (G4). `ModuleRenderer` declares no
             emits, so the listener rides its attribute fallthrough onto the
             archetype surface it renders — which is what keeps the dispatcher
             free of any one surface's channels. -->
        <ModuleRenderer
          :descriptor="descriptor"
          :port="port"
          :presentation="scenario.presentation"
          :handoffs="handoffs"
          :locked="isReplaying"
          @update:collection-actions="onCollectionActions"
        />
      </div>
    </ForcedCanvas>
  </UpmLayout>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioPlayground
 * @description THE scenario host — ONE component behind every scenario route,
 * at every scope the url names (`/:brandId?/:scenario/as/:actor/for/:type/:id`).
 * It holds no module knowledge: the route names the scenario, the declaration
 * boots the seam port, the harness reflects that port into the descriptor
 * `ModuleRenderer` dispatches on, and the declaration's own presentation rides
 * alongside so a surface draws what the scenario declared rather than what it
 * can sniff off a row.
 *
 * No scenario has a page file of its own, so there is nowhere for one to
 * acquire its own boot: `useModulePort` is called here, once, for all of them,
 * at the scope the URL names and nothing else (`R6-30b`).
 *
 * The page draws in three regions: its own header, its scenario bar, and the
 * surface inside the forced frame. The bar is a DESCENDANT of this content root
 * rather than of the app chrome (`G9`, `AC2.1`): scenarios are page-scoped, so
 * the bar scrolls away with the page it belongs to while the scope bar — which
 * is global — stays in the header above it.
 *
 * It owns the page's ONE player (`S19`): the bar renders it and the sheet panes
 * read the same playhead, so two transports can never each own `track=`. A
 * scenario declaring no `tracks` has no playlist at all, which leaves the bar on
 * Live with no transport — the state every page boots into anyway (`S12`), and
 * the state the whole playground is in while `ESC6` is unruled.
 *
 * It is also the RENDERED half of "raw vs rendered": a cell that owns criteria
 * gets its own declared filter bar inside the surface's toolbar, and the sheets
 * — where the raw schema · uischema · model · built wire live — overlay it on
 * demand. All THREE providers are registered below (`AC3.1`/`AC3.2`): the Debug
 * section, the Code snippet and the Scenario view. Registered, never imported
 * by the host, and on this page's own lifetime — so the one sheet over the
 * playground holds no knowledge of which page is under it.
 */

import { UpmLayout } from "@upmind-automation/client-vue";
import { createHarness } from "@upmind-automation/scenario-harness";
import { ModuleRenderer } from "./components";
import ForcedCanvas from "./components/ForcedCanvas.vue";
import PageHeader from "./components/PageHeader.vue";
import ScenarioBar from "./components/ScenarioBar.vue";
import { useCriteriaUrlSync } from "./composables/useCriteriaUrlSync";
import { useFeatureTracks } from "./composables/useFeatureTracks";
import { useForcedState } from "./composables/useForcedState";
import { useModulePort } from "./composables/useModulePort";
import { useScenarioPlayer } from "./composables/useScenarioPlayer";
import { featureTracksFor } from "./force/corpus.source";
import { scenarioRegistry, scenarioRoutes, scenarioSources } from "./registry";
import { SCENARIO_ROUTE_META_KEY } from "./scenario.constants";
import { get, mapValues } from "lodash-es";
import type { ActionSlotItem } from "./components";
import type {
  FourLayerComposable,
  RegisteredScenario,
  ResolvedHandoff
} from "./scenario.types";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { ScopeActor } from "@upmind-automation/scenario-harness";
import { useContextScopeSelector } from "~/components/scope";
import { usePlaygroundSheet } from "~/components/sheets/usePlaygroundSheet";
import { PlaygroundSheetTypes } from "~/components/sheets/usePlaygroundSheet.types";
import {
  useActorScope,
  useContextScope,
  useScopeConfig
} from "~/composables/scope";

// -----------------------------------------------------------------------------

definePageMeta({
  // Key by PATH, never `fullPath`: the scope segments (`/:brandId`, `/as/:actor`,
  // `/for/:type/:id`) are what the port is built from, so they must remount and
  // rebuild it — while the criteria, which task 58 persists into the QUERY
  // string, must not. A `fullPath` key ties a teardown to every filter write.
  key: route => route.path
  // NO `name`/`path` here: `augmentPages` assigns an extracted macro name onto
  // every route sharing this file, so one declared here would collapse all
  // sixty scenario routes onto a single name.
});

const route = useRoute();

const scenarioRoute = get(route.meta, SCENARIO_ROUTE_META_KEY) as string;
const scenario: RegisteredScenario | undefined = get(
  scenarioRoutes,
  scenarioRoute
);

if (!scenario)
  throw createError({
    statusCode: 404,
    statusMessage: `Unregistered scenario route "${scenarioRoute}"`
  });

const scenarioKey = scenario.key;

const actorScope = useActorScope();
const contextScope = useContextScope();

// A handoff is the module's OWN editor, declared inline (`R6-27`): the
// composable it boots is this declaration's `useMutate`, so a module publishing
// none offers no editor control at all rather than one that opens nothing.
const handoffs = computed<Record<string, ResolvedHandoff>>(() =>
  scenario.useMutate
    ? mapValues(scenario.handoff ?? {}, handoff => ({
        ...handoff,
        useMutate: scenario.useMutate as FourLayerComposable,
        actor: actorScope.value
      }))
    : {}
);

// The collection where the module publishes one, else its editor — the pair the
// binding's own union guarantees at least one of.
const port = useModulePort((scenario.useList ?? scenario.useMutate)!, {
  actor: actorScope.value,
  context: contextScope.value
});

// --- Request state ⇄ url, when the scenario opts in
useCriteriaUrlSync(port.criteria, { enabled: scenario.persistCriteria });

const harness = createHarness(scenarioRegistry);
const descriptor = computed(() =>
  harness.reflect(scenarioKey, actorScope.value as ScopeActor, port)
);

// --- The page's own header, drawn from the surface's already-bound controls
const collectionActions = ref<ActionSlotItem[]>([]);

function onCollectionActions(actions: ActionSlotItem[]): void {
  collectionActions.value = actions;
}

// The acting-for picker offers what the COMPOSABLE's own matrix declares, read
// off the cell this page booted rather than re-declared beside it (`R6-31`).
const { register: registerContexts } = useContextScopeSelector();
if (port.scopeMatrix) registerContexts(port.scopeMatrix);

// --- Playlist and transport
// `tracks` names the MODULE (`R6-37`); the seam hands back that module's own
// committed playlist and the catalog that plays it, and a module it does not
// reach leaves the page Live-only (`S12`).
const trackSource = scenario.tracks
  ? featureTracksFor(scenario.tracks)
  : undefined;

const tracks = trackSource ? useFeatureTracks(trackSource).tracks : [];

const player = useScenarioPlayer({ tracks, criteria: port.criteria });

// A replay is a PLAYBACK, so while a track is armed the page's own controls are
// the script's (`R6-23`). It reads the armed TRACK rather than the player's
// status: `FAILED` and `PAUSED` are still a track holding the surface, and only
// Live — which is `stop()` — hands it back.
const isReplaying = computed(() => !!player.track.value);

// The frame reads the worker's own preset rather than the player's status: a
// pasted `force=` link arms with no track at all, and only the handle knows
// what is actually being served (`AC8.4`).
const { preset } = useForcedState();

// --- The page's three sheet providers, all page-scoped
const { register, registerPane } = usePlaygroundSheet();

const scope = useScopeConfig();

register({
  key: `scenario-${scenarioKey}-${route.path}`,
  factory: () => ({
    name: scenario.route,
    meta: port.getMeta(),
    context: descriptor.value.snapshot.context
  })
});

// The developer's own call, armed or live (`R7-6`): a scene moves the criteria
// this hands over, so the state a stop reaches is already what the pane prints.
registerPane(PlaygroundSheetTypes.CODE, () => ({
  name: scenario.route,
  scope: scope.value,
  criteria: port.criteria
}));

registerPane(PlaygroundSheetTypes.SCENARIO, () => {
  const armed = player.track.value;
  const declared = armed?.scope;

  return {
    declaration: get(scenarioSources, scenarioRoute, ""),
    featureText: trackSource?.feature,
    trackName: armed?.name,
    // The armed track's own scenes and the transport that moves between them:
    // the pane's step list and the bar's scene rail are two views of the SAME
    // stops, so both seek through the one player (`R6-24`).
    scenes: armed?.scenes,
    playhead: player.playhead.value,
    seek: (index: number) => void player.seek(index),
    // The harness's `ScopeActor` mirrors the headless enum over its vue-free
    // source and shares its wire values (`useScenarioWorld`).
    trackScope: declared && {
      brandId: declared.brandId,
      actor: declared.actor as ScopeActorTypes,
      context: declared.context
    }
  };
});

// --- Lifecycle
onMounted(() => {
  const isReady = get(port.actions, "isReady");
  if (isReady) isReady();
});

onUnmounted(() => {
  const destroy = get(port.actions, "destroy");
  if (destroy) destroy();
});
</script>
