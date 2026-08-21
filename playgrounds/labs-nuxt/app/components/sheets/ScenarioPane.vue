<template>
  <div :class="styles.scenarioPane.root" data-test-key="scenario-pane">
    <!-- ARMED: the playing scenario ALONE — its own stops, nothing else
         (`R6-20`). The whole declaration is a thousand-pixel file, and a pane
         that opened on it while a track was playing buried the one thing being
         watched. -->
    <section
      v-if="isArmed"
      :class="styles.scenarioPane.section"
      data-test-key="scenario-track"
      :data-test-value="trackName"
    >
      <header :class="styles.scenarioPane.trackHeader">
        <h2 :class="styles.scenarioPane.title">{{ trackName }}</h2>
        <Badge
          color="primary"
          variant="muted"
          size="sm"
          :label="t('labs.scenario_track_armed')"
        />
        <Badge
          v-if="trackScopePath"
          :label="t('labs.scenario_track_scope', { scope: trackScopePath })"
          color="neutral"
          variant="minimal"
          size="sm"
          :data-attrs="{
            'data-test-key': 'scenario-track-scope',
            'data-test-value': trackScopePath
          }"
        />
      </header>

      <!-- Every stop is reachable by hand, without playing through: a step IS a
           seek target, and the rail and this list are two views of the same
           stops (`R6-22`/`R6-24`). A real button, so the list is keyboard
           operable for free. -->
      <ol :class="styles.scenarioPane.steps">
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
            <Icon
              :icon="STEP_STATE_ICONS[stepState(index)]"
              size="nano"
              :class="styles.scenarioPane.stepIcon"
            />
            <span :class="styles.scenarioPane.stepKind">{{ scene.kind }}</span>
            <span :class="styles.scenarioPane.stepText">{{ scene.text }}</span>
          </button>
        </li>
      </ol>
    </section>

    <!-- LIVE: the page's whole declaration and every scenario behind it. The
         declaration is disclosed rather than dumped — the playlist is what the
         pane is opened for, and a fence taller than the panel pushes it out of
         sight (`R6-21`). -->
    <template v-else>
      <section
        :class="styles.scenarioPane.section"
        data-test-key="scenario-declaration"
      >
        <Collapsible>
          <CollapsibleTrigger as-child>
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              icon-append="chevron-down"
              :label="t('labs.scenario_declaration')"
              :class="styles.scenarioPane.disclosure"
              :data-attrs="{ 'data-test-key': 'scenario-declaration-toggle' }"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Markdown
              :model-value="declarationFence"
              :class="styles.scenarioPane.fence"
            />
          </CollapsibleContent>
        </Collapsible>
      </section>

      <section
        :class="styles.scenarioPane.section"
        data-test-key="scenario-feature"
      >
        <h2 :class="styles.scenarioPane.title">
          {{ t("labs.scenario_feature") }}
        </h2>

        <p
          v-if="isEmpty(tracks)"
          :class="styles.scenarioPane.empty"
          data-test-key="scenario-feature-empty"
        >
          {{ t("labs.scenario_feature_pending") }}
        </p>

        <div v-else :class="styles.scenarioPane.playlist">
          <article
            v-for="track in tracks"
            :key="track.line"
            :class="styles.scenarioPane.track"
            data-test-key="scenario-track"
            :data-test-value="track.name"
          >
            <header :class="styles.scenarioPane.trackHeader">
              <Badge
                :label="track.name"
                color="neutral"
                variant="muted"
                size="sm"
              />
            </header>

            <ol :class="styles.scenarioPane.steps">
              <li
                v-for="step in track.steps"
                :key="step.line"
                :class="stepRow({ state: STEP_STATE.PENDING })"
                data-test-key="scenario-step"
                :data-test-value="step.line"
              >
                <span :class="styles.scenarioPane.stepKind">
                  {{ step.kind }}
                </span>
                <span :class="styles.scenarioPane.stepText">
                  {{ step.text }}
                </span>
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

import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { parseFeatureScenarios } from "@upmind-automation/scenario-harness";
import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Icon,
  Markdown,
  useStyles
} from "@upmind-automation/upmind-ui";
import { buildScopePath } from "../../composables/scope";
import config, { stepRow } from "./ScenarioPane.styles";
import {
  STEP_STATE,
  STEP_STATE_ICONS,
  STEP_STATE_LABELS
} from "./ScenarioPane.types";
import { isEmpty, isNil } from "lodash-es";
import type { ScenarioPaneProps, StepState } from "./ScenarioPane.types";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";
import type { ComponentPublicInstance } from "vue";
// -----------------------------------------------------------------------------

const props = defineProps<ScenarioPaneProps>();

const { t } = useI18n();

const isArmed = computed(
  () => !isEmpty(props.trackName) && !isNil(props.scenes)
);

const declarationFence = computed(
  () => `\`\`\`ts\n${props.declaration}\n\`\`\``
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

const styles = useStyles(["scenarioPane"], {}, config);
</script>
