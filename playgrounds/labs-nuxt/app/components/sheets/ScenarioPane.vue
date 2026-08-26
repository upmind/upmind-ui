<template>
  <div class="flex flex-col gap-6" data-test-key="scenario-pane">
    <section
      v-if="isArmed"
      class="flex flex-col gap-3"
      data-test-key="scenario-track"
      :data-test-value="trackName"
    >
      <header class="flex flex-wrap items-center gap-2">
        <h2 class="text-display m-0 font-mono text-sm font-semibold">
          {{ trackName }}
        </h2>
        <Badge variant="primary" appearance="muted" size="sm">
          {{ t("labs.scenario_track_armed") }}
        </Badge>
        <Badge
          v-if="trackScopePath"
          variant="neutral"
          appearance="muted"
          size="sm"
          data-test-key="scenario-track-scope"
          :data-test-value="trackScopePath"
        >
          {{ trackScopePath }}
        </Badge>
      </header>

      <ol class="m-0 flex list-none flex-col p-0">
        <li v-for="(scene, index) in scenes" :key="scene.line">
          <button
            :ref="element => keepInView(element, index)"
            type="button"
            :class="stepRow({ state: stepState(index) })"
            :aria-current="index === playhead ? 'step' : undefined"
            :title="t(STEP_STATE_LABELS[stepState(index)])"
            data-test-key="scenario-step"
            :data-test-value="scene.line"
            @click="seek?.(index)"
          >
            <span class="text-faint w-8 shrink-0 text-right font-mono text-xs">
              {{ scene.line }}
            </span>
            <span
              class="text-muted w-14 shrink-0 text-xs font-semibold uppercase"
            >
              {{ scene.kind }}
            </span>
            <span class="min-w-0 flex-1 text-left text-sm">{{
              scene.text
            }}</span>
            <Icon
              :icon="STEP_STATE_ICONS[stepState(index)]"
              size="xs"
              :class="stepIcon({ state: stepState(index) })"
            />
          </button>
        </li>
      </ol>
    </section>

    <template v-else>
      <section class="flex flex-col gap-2" data-test-key="scenario-declaration">
        <Collapsible>
          <CollapsibleTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="text-muted hover:text-display -ml-2.5 cursor-pointer text-xs font-semibold tracking-wider uppercase"
              :data-attrs="{ 'data-test-key': 'scenario-declaration-toggle' }"
            >
              {{ t("labs.scenario_declaration") }}
              <Icon icon="chevron-down" size="xs" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CodeBlock
              :code="declaration"
              lang="ts"
              :title="t('labs.scenario_declaration')"
              :line-numbers="false"
              class="max-h-64"
            />
          </CollapsibleContent>
        </Collapsible>
      </section>

      <section class="flex flex-col gap-3" data-test-key="scenario-feature">
        <h2 class="text-display m-0 text-sm font-bold">
          {{ t("labs.scenario_feature") }}
        </h2>

        <p
          v-if="isEmpty(tracks)"
          class="text-muted m-0 text-sm"
          data-test-key="scenario-feature-empty"
        >
          {{ t("labs.scenario_feature_pending") }}
        </p>

        <div v-else class="flex flex-col gap-4">
          <article
            v-for="track in tracks"
            :key="track.line"
            class="flex flex-col gap-2"
            data-test-key="scenario-track"
            :data-test-value="track.name"
          >
            <header class="flex flex-wrap items-center gap-2">
              <Badge variant="neutral" appearance="muted" size="sm">
                {{ track.name }}
              </Badge>
            </header>

            <ol class="m-0 flex list-none flex-col p-0">
              <li
                v-for="step in track.steps"
                :key="step.line"
                :class="stepRow({ state: STEP_STATE.PENDING })"
                data-test-key="scenario-step"
                :data-test-value="step.line"
              >
                <span
                  class="text-faint w-8 shrink-0 text-right font-mono text-xs"
                >
                  {{ step.line }}
                </span>
                <span
                  class="text-muted w-14 shrink-0 text-xs font-semibold uppercase"
                >
                  {{ step.kind }}
                </span>
                <span class="min-w-0 flex-1 text-left text-sm">{{
                  step.text
                }}</span>
              </li>
            </ol>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module sheets/ScenarioPane
 * @description The Scenario view, in the two states the ruling gives it
 * (`R6-20`): on LIVE the page's own declaration and every scenario behind it; on
 * ARMED the playing scenario ALONE, its stops carrying done · current · pending
 * at a glance and each one a seek target (`AC3.4`, `H4`, `R6-22`, `R6-24`).
 *
 * The armed list is the PLAYER's own scenes, not a second parse: the scene rail
 * in the bar and this list are two views of the same stops, so clicking either
 * runs the same `seek(index)` — a replay from scene 0 up to it, deterministic
 * because the corpus is fixed — and neither can name a stop the other does not
 * have. The current stop is scrolled into view as playback advances, so a long
 * scenario does not leave the playhead below the fold.
 *
 * On Live the playlist is the harness's own `parseFeatureScenarios`, the same
 * parser the player's tracks come from, and its steps are display-only: there is
 * no transport to seek in until a track is armed.
 *
 * The Gherkin reaches app runtime through the `ESC6` seam
 * (`modules/scenarios/runtime/force/corpus.source.ts`), whose interior is
 * unresolved: it is `""` today, so the pane draws its empty state and says so.
 * That is the ruled degradation, not a defect — with no playlist there are no
 * tracks and Live carries the page alone (`S12`, `S23`).
 *
 * The armed track wears its declared SCOPE beside its name. A staff track is
 * playable while the acting-for picker greys the staff actor row, and with that
 * scope off screen the disagreement reads as a bug rather than as the open
 * question it is (design §7.5, `ESC5`).
 */

import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@upmind/ui";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
import { parseFeatureScenarios } from "@upmind-automation/scenario-harness";
import { buildScopePath } from "../../composables/scope";
import { stepRow, stepIcon } from "./ScenarioPane.styles";
import {
  STEP_STATE,
  STEP_STATE_ICONS,
  STEP_STATE_LABELS
} from "./ScenarioPane.types";
import { isEmpty, isNil } from "lodash-es";
import type { ScenarioPaneProps, StepState } from "./ScenarioPane.types";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";
import type { ComponentPublicInstance } from "vue";
import CodeBlock from "~/components/code/CodeBlock.vue";

const props = defineProps<ScenarioPaneProps>();

const { t } = useI18n();

const isArmed = computed(
  () => !isEmpty(props.trackName) && !isNil(props.scenes)
);

const tracks = computed<FeatureScenario[]>(() =>
  parseFeatureScenarios(props.featureText ?? "")
);

const trackScopePath = computed(() =>
  props.trackScope
    ? buildScopePath({
        page: "",
        actor: props.trackScope.actor,
        context: props.trackScope.context
      })
    : undefined
);

function stepState(index: number): StepState {
  const playhead = props.playhead ?? -1;
  if (index === playhead) return STEP_STATE.CURRENT;
  return index < playhead ? STEP_STATE.DONE : STEP_STATE.PENDING;
}

// The current stop stays in view as playback advances (`R6-24`). Held by index
// rather than by a template ref list, because the list is re-keyed on the armed
// track and a stale node would scroll the wrong row.
const rows = new Map<number, HTMLElement>();

function keepInView(
  element: Element | ComponentPublicInstance | null,
  index: number
): void {
  if (element instanceof HTMLElement) rows.set(index, element);
  else rows.delete(index);
}

watch(
  () => props.playhead,
  index => {
    if (isNil(index)) return;
    rows.get(index)?.scrollIntoView({ block: "nearest" });
  }
);
</script>
