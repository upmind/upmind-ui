<template>
  <component
    :is="embedded ? 'section' : Page"
    v-bind="embedded ? panelAttrs : pageAttrs"
  >
    <!-- The mocking glow is the WHOLE page's, not a box around the table
         (`R6-18`): what is faked is the page, and the outline it is drawn with
         reserves no space, so nothing below moves when a preset arms. In an
         area it frames the panel that is faked. -->
    <ForcedCanvas
      :preset="preset"
      :label="forcedState ? t(forcedState.label) : undefined"
    >
      <div class="flex flex-col gap-4">
        <!-- A replay is not interactive (`R6-23`): with a track armed the page's
             own controls are the SCRIPT's, so both halves that own one are told
             so, and picking Live releases them in the same tick. -->
        <PageHeader
          v-if="!embedded"
          :name="scenario.route"
          :actions="headerActions"
          :locked="isLocked"
        />
        <PanelHeader
          v-else-if="heading || headerActions.length"
          :name="heading ?? ''"
          :actions="headerActions"
          :locked="isLocked"
        />

        <ScenarioBar
          v-if="!embedded || tracks.length"
          :player="player"
          :tracks="tracks"
          :states="states"
        />

        <!-- The collection's own actions reach the header through the surface
             that owns the editor they open (G4). `ModuleRenderer` declares no
             emits, so the listener rides its attribute fallthrough onto the
             archetype surface it renders — which is what keeps the dispatcher
             free of any one surface's channels. -->
        <div :class="scenarioPlayground.stage()">
          <template v-if="recordUischema">
            <RecordSurface
              v-if="record?.subjectId.value"
              :uischema="recordUischema"
              :port="port"
              :locked="isLocked"
            />
            <RecordLookup
              v-else-if="recordUischema.picker"
              :picker="recordUischema.picker"
              :route="scenario.route"
            />
          </template>
          <Card v-else size="sm">
            <ModuleRenderer
              :descriptor="descriptor"
              :port="port"
              :presentation="scenario.presentation"
              :handoffs="handoffs"
              :detail="detail"
              :locked="isLocked"
              :forced-refusal="forcedRefusal"
              :forced-state="forcedState"
              @update:collection-actions="onCollectionActions"
            />
          </Card>
          <!-- While a scenario plays or a forced state is armed, the page content
               is the SCRIPT's: a transparent scrim takes every click off it, the
               bar above stays the operator's, and Live lifts it (`R6-23`). -->
          <div
            v-if="isLocked"
            :class="scenarioPlayground.scrim()"
            :title="t('labs.replay_locked')"
            aria-hidden="true"
            data-test-key="replay-scrim"
          />
        </div>
      </div>
    </ForcedCanvas>
  </component>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioPanel
 * @description ONE binding, drawn — the body every scenario route is made of.
 * A single-surface page is exactly one panel; an area (`tabs`) stacks several,
 * each booting its own binding, and draws each one under the area's own header
 * (`embedded`). It holds no module knowledge: the declaration boots the seam
 * port, the harness reflects that port into the descriptor `ModuleRenderer`
 * dispatches on, and the declaration's own presentation rides alongside so a
 * surface draws what the scenario declared rather than what it can sniff off a
 * row.
 *
 * No scenario has a page file of its own, so there is nowhere for one to
 * acquire its own boot: `useModulePort` is called here, once per binding, at
 * the scope the URL names and nothing else (`R6-30b`).
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

import { Card, Page } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { resolveSelfActor, ScopeActorTypes } from "@upmind-automation/headless";
import { ARCHETYPE, createHarness } from "@upmind-automation/scenario-harness";
import { ModuleRenderer } from "./components";
import ForcedCanvas from "./components/ForcedCanvas.vue";
import PageHeader from "./components/PageHeader.vue";
import PanelHeader from "./components/PanelHeader.vue";
import ScenarioBar from "./components/ScenarioBar.vue";
import { RecordLookup, RecordSurface } from "./components/surfaces";
import { useCriteriaUrlSync } from "./composables/useCriteriaUrlSync";
import { useModulePort } from "./composables/useModulePort";
import { useRecordTransport } from "./composables/useRecordTransport";
import { useScenarioTransport } from "./composables/useScenarioTransport";
import { scenarioRegistry, scenarioSources } from "./registry";
import { ActionPlacementTypes, DEFAULT_ROW_IDENTIFIER } from "./scenario.types";
import { paramNameOf } from "./scenario.utils";
import { scenarioPlayground } from "./ScenarioPlayground.styles";
import {
  get,
  isArray,
  isFunction,
  mapValues,
  reduce,
  toPairs
} from "lodash-es";
import type { ActionSlotItem } from "./components";
import type { ForceReset } from "./composables/useForcedState.types";
import type {
  FourLayerComposable,
  ResolvedDetail,
  ResolvedHandoff
} from "./scenario.types";
import type { ScenarioPanelProps } from "./ScenarioPanel.types";
import type { Archetype } from "@upmind-automation/scenario-harness";
import type { ScopeActor } from "@upmind-automation/scenario-harness";
import type { ScopeContextForm } from "~/components/scope";
import { useContextScopeSelector } from "~/components/scope";
import { usePlaygroundSheet } from "~/components/sheets/usePlaygroundSheet";
import { PlaygroundSheetTypes } from "~/components/sheets/usePlaygroundSheet.types";
import {
  useActorScope,
  useContextScope,
  useScopeConfig
} from "~/composables/scope";

// -----------------------------------------------------------------------------

const route = useRoute();

const props = defineProps<ScenarioPanelProps>();

const scenario = props.scenario;
const pageAttrs = { width: "full" } as const;
const panelAttrs = {
  "data-test-key": "scenario-panel",
  "data-test-value": scenario.key
};

const scenarioKey = scenario.key;

const actorScope = useActorScope();
const contextScope = useContextScope();

// An emailed link token rides the query (`?token=`), read the way the client
// area reads it (vue-app `to.query.token`). It is the client cell's own identity
// when it carries no session — `.withId(token)` is the addressability the
// opt-outs read boots on — so it is threaded as the single-record id ONLY for a
// client url, leaving every other actor's id channel untouched. Absent, the
// client cell falls back to the active session, or boots unaddressable and
// settles to its empty list.
const rawToken = route.query.token;
const linkToken = (isArray(rawToken) ? rawToken[0] : rawToken) || undefined;

// A handoff is the module's OWN editor, declared inline (`R6-27`): the
// composable it boots is this declaration's `useMutate`, so a module publishing
// none offers no editor control at all rather than one that opens nothing.
const handoffs = computed<Record<string, ResolvedHandoff>>(() =>
  scenario.useMutate
    ? mapValues(scenario.handoff ?? {}, handoff => ({
        ...handoff,
        useMutate: scenario.useMutate as FourLayerComposable,
        actor: actorScope.value,
        offeredActors: scenario.actors,
        id: actorScope.value === ScopeActorTypes.CLIENT ? linkToken : undefined
      }))
    : {}
);

// The read a row opens READ-ONLY, bound like the handoff to the actor the
// collection is driven at. A scenario declaring none leaves the overlay on the
// row's own data (`R6-30b`); the row→`.for(type, id)` resolution stays with the
// surface that holds the row.
const detail = computed<ResolvedDetail | undefined>(() =>
  scenario.useDetail
    ? {
        useDetail: scenario.useDetail,
        actor: actorScope.value,
        identifier: scenario.identifier ?? DEFAULT_ROW_IDENTIFIER
      }
    : undefined
);

// A manager addressed by a declared route param (`/useContractProduct/:id`)
// boots one cell per record, the url's or the one a replay's recording names.
const recordParam = scenario.useManage
  ? paramNameOf(scenario.params?.[0])
  : undefined;
const rawRecordId = recordParam ? route.params[recordParam] : undefined;
const recordId =
  (isArray(rawRecordId) ? rawRecordId[0] : rawRecordId) || undefined;

// A manager addressing the session's own record (no route param) boots at the
// actor alone and draws at once; one addressed by a param waits for the id.
const record =
  scenario.useManage && (recordParam || scenario.presentation.record)
    ? useRecordTransport({
        key: scenarioKey,
        composable: scenario.useManage,
        id: recordParam ? (recordId ?? linkToken) : undefined,
        idless: !recordParam,
        actor: actorScope.value,
        offeredActors: scenario.actors
      })
    : undefined;

// The RECORD archetype: a manager that declares how its one record draws.
const recordUischema = record ? scenario.presentation.record : undefined;

// The collection where the module publishes one, else its editor — the pair the
// binding's own union guarantees at least one of.
const port =
  record?.port ??
  useModulePort((scenario.useList ?? scenario.useMutate)!, {
    actor: actorScope.value,
    context: contextScope.value,
    id: actorScope.value === ScopeActorTypes.CLIENT ? linkToken : undefined,
    // The actors this declaration offers beyond SELF. Identity comes from the
    // session store — `switchScope` activates the matching session as it pushes
    // the url — so nothing else is needed to serve them.
    offeredActors: scenario.actors
  });

// --- Request state ⇄ url, when the scenario opts in
useCriteriaUrlSync(port.criteria, { enabled: scenario.persistCriteria });

const harness = createHarness(scenarioRegistry);
const reflected = computed(() =>
  harness.reflect(scenarioKey, actorScope.value as ScopeActor, port)
);

// The archetype is read off the LIVE snapshot, and a snapshot mid-load — the
// boot, the cache a forced state has just cleared — carries no schema and no
// rows, so `classify()` falls to ACTION_PANEL and the page changes SURFACE for
// the duration: a "Loading" notice standing where the form was, not the form's
// own skeleton (C8). So the page keeps the archetype it last classified to
// while the fresh reading is the fallback; a manager-only declaration is a
// form by construction and starts as one before its first schema lands.
const latchedArchetype = ref<Archetype | undefined>(
  scenario.useMutate && !scenario.useList ? ARCHETYPE.FORM_FLOW : undefined
);
watch(
  () => reflected.value.archetype.archetype,
  archetype => {
    if (archetype !== ARCHETYPE.ACTION_PANEL)
      latchedArchetype.value = archetype;
  },
  { immediate: true }
);
const descriptor = computed(() => {
  const fresh = reflected.value;
  const kept = latchedArchetype.value;
  return kept && fresh.archetype.archetype !== kept
    ? { ...fresh, archetype: { ...fresh.archetype, archetype: kept } }
    : fresh;
});

// --- The page's own header, drawn from the surface's already-bound controls
const collectionActions = ref<ActionSlotItem[]>([]);

function onCollectionActions(actions: ActionSlotItem[]): void {
  collectionActions.value = actions;
}

// The acting-for picker offers what the COMPOSABLE's own matrix declares, read
// off the cell this page booted rather than re-declared beside it (`R6-31`).
//
// The "Act for" form is the cell's own too: the module's context publishes
// `schemas.lookups` with each control already bound to its lookup, so the bar
// renders it and reaches no service.
const { register: registerContexts } = useContextScopeSelector();
const contextForm = get(
  isFunction(port.useContext) ? port.useContext() : undefined,
  ["schemas", "lookups"]
) as ScopeContextForm | undefined;
if (!props.embedded && port.scopeMatrix)
  registerContexts(port.scopeMatrix, contextForm);

// --- Playlist and transport
// The playlist, the forced-state offer and the page's ONE player (`S19`), built
// by the composable a SELF-DRAWN page reaches for the same wiring
// (`useScenarioTransport`) — one behaviour, two hosts.
//
// The cache clear the arm ends on is the booted module's OWN, handed in because
// forcing may learn no query key (FE-3113): `reset` is already bound to the
// domain this module caches under, which neither the url nor a recorded path
// spells. A module publishing none leaves the arm swapping the transport alone.
const {
  tracks,
  featureText,
  states,
  player,
  preset,
  forcedState,
  forcedRefusal,
  isLocked
} = useScenarioTransport({
  module: scenario.tracks,
  criteria: port.criteria,
  reset: record
    ? () => (get(port.actions, "reset") as ForceReset | undefined)?.()
    : (get(port.actions, "reset") as ForceReset | undefined),
  world: record?.world,
  scope: record
    ? () => ({ actor: resolveSelfActor(actorScope.value) as ScopeActor })
    : undefined
});

record?.follow(player);

// --- Labs page actions: HEADER actions the declaration backs with its own
// composables rather than the cell's port (`pageActions`). Each factory is
// booted once here; the offered ones render in the header beside the
// collection's own controls, presented from the matching declared action.
const { t } = useI18n();

const pageActions = mapValues(scenario.pageActions ?? {}, ({ use }) => use());

const pageActionItems = computed<ActionSlotItem[]>(() =>
  reduce(
    toPairs(pageActions),
    (items: ActionSlotItem[], [name, instance]) => {
      const declared = scenario.pageActions?.[name];
      if (!declared || !instance.isOffered.value) return items;

      items.push({
        name,
        label: t(declared.i18n),
        icon: declared.icon,
        variant: declared.variant,
        placement: ActionPlacementTypes.HEADER,
        disabled:
          isLocked.value ||
          instance.isRunning.value ||
          !!instance.isDisabled?.value,
        disabledReason: instance.disabledReason?.value,
        loading: instance.isRunning.value,
        onSelect: () => void instance.run()
      });
      return items;
    },
    []
  )
);

const headerActions = computed<ActionSlotItem[]>(() => [
  ...pageActionItems.value,
  ...collectionActions.value
]);

// --- The page's three sheet providers, all page-scoped
const { register, registerPane } = usePlaygroundSheet();

const scope = useScopeConfig();

register({
  key: `scenario-${scenarioKey}-${route.path}`,
  factory: () => ({
    name: props.embedded ? scenarioKey : scenario.route,
    meta: port.getMeta(),
    context: descriptor.value.snapshot.context
  })
});

// The developer's own call, armed or live (`R7-6`): a scene moves the criteria
// this hands over, so the state a stop reaches is already what the pane prints.
// One pane per sheet, whichever panel is drawn: an area's lead panel owns them.
if (!props.embedded || props.primary) {
  registerPane(PlaygroundSheetTypes.CODE, () => ({
    name: scenario.route,
    scope: scope.value,
    criteria: port.criteria
  }));

  registerPane(PlaygroundSheetTypes.SCENARIO, () => {
    const armed = player.track.value;
    const declared = armed?.scope;

    return {
      declaration: get(scenarioSources, scenario.route, ""),
      featureText,
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
}

// --- Lifecycle
onMounted(() => {
  const isReady = get(port.actions, "isReady");
  if (isReady) isReady();
});

onUnmounted(() => {
  if (record) return;
  const destroy = get(port.actions, "destroy");
  if (destroy) destroy();
});
</script>
