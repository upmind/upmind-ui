<template>
  <Stepper
    ref="rail"
    :items="steps"
    :model-value="step"
    :linear="false"
    :ui="uiConfig"
    :aria-label="t('labs.scene_rail')"
    data-test-key="scene-rail"
    :class="sceneRail.root()"
    @update:model-value="scrub"
  >
    <!-- The stop's `title` is a HOVER affordance: it reaches no keyboard and no
         screen reader, so a rail of numbered dots announced nothing but its
         numbers. The sentence rides an sr-only label instead — the dots-only
         drawing (operator ruling) is untouched, since `sr-only` takes the
         label out of flow. -->
    <template #step="{ step: stop }">
      <span class="sr-only">{{ sceneText(stop.step) }}</span>
    </template>
  </Stepper>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/SceneRail
 * @description The armed track's scenes as the scrubber the playhead moves
 * along (`AC2.5`, `AC2.7`). It IS the ui `Stepper`: a list of steps plus a
 * v-model index is already a scrubber, so there is no hand-rolled rail here and
 * no second drawing of a track's progress (`D9`).
 *
 * It reads as the page's BREADCRUMB of progress through the scenario (`R7-8`):
 * its own full-width row under the bar, at the package's own scale, where a
 * stop's whole Gherkin sentence fits rather than being ellipsised to a fragment.
 *
 * It is a pure read of one number. Picking a scene writes the index back and
 * nothing else — replaying up to it is the player's job, and the surface, the
 * Code fence and the marked Gherkin line follow the same playhead, which is why
 * scrubbing moves all three at once and reloads nothing.
 *
 * Every stop reads done · current · pending from the `Stepper`'s own state, and
 * the current one is kept in the lane as playback advances (`R6-24`): this rail
 * and the Scenario sheet's list are two views of the same stops, so neither may
 * leave the playhead out of sight.
 */

import { Stepper } from "@upmind/ui";
import { computed, nextTick, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { sceneRail } from "./SceneRail.styles";
import { get, map } from "lodash-es";
import type { SceneRailProps } from "./SceneRail.types";
import type { StepperStep } from "@upmind/ui";
import type { ComponentPublicInstance } from "vue";
// -----------------------------------------------------------------------------

const props = defineProps<SceneRailProps>();

/** The playhead, as an index into `scenes` — `-1` before the first scene runs. */
const playhead = defineModel<number>({ required: true });

const { t } = useI18n();

// No titles: six Gherkin sentences on one horizontal row collide into mush.
// R4 draws the playhead as dots and names the current scene ONCE, in the bar's
// position label; the Scenario sheet is where the stops are read in full.
const steps = computed<StepperStep[]>(() =>
  map(props.scenes, (scene, index) => ({
    step: index + 1,
    dataAttrs: { title: scene.text }
  }))
);

// The stepper counts its steps from 1; the playhead counts scenes from 0 and
// sits at -1 while the track is armed but unplayed — which lands on step 0, a
// value no item holds, so nothing is marked until the first scene runs.
const step = computed(() => playhead.value + 1);

/** One stop's Gherkin sentence, by the 1-based step the Stepper hands back. */
function sceneText(stop: number): string {
  return get(props.scenes, [stop - 1, "text"], "");
}

// `linear` is off in the template on purpose: stepping backwards is a replay
// from scene 0 (design §3.1 ruling 1), so every scene is reachable in one pick,
// not just the next one.
function scrub(next: number | undefined): void {
  playhead.value = (next ?? 0) - 1;
}

// The current stop stays in view as playback advances, in THIS view of the
// stops as much as in the sheet's list (`R6-24`) — a rail wide enough to scroll
// otherwise leaves the playhead off its own lane. The stop is found by the very
// `data-state` the rail's own treatment is keyed on (`SceneRail.styles`), so
// nothing new is reached into: the marked step is the scrolled step by
// construction, and a rail that draws no marked step scrolls nowhere.
const rail = useTemplateRef<ComponentPublicInstance>("rail");

watch(step, async () => {
  await nextTick();

  const lane = rail.value?.$el as HTMLElement | undefined;
  const stop = lane?.querySelector('[data-state="active"]');

  // Called optionally because `scrollIntoView` is a rendering-engine API jsdom
  // does not implement: the rail must draw under a component test, and a
  // playhead that threw on a headless DOM would take the whole bar with it.
  stop?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
});

const uiConfig = computed(() => ({
  item: sceneRail.item(),
  trigger: sceneRail.trigger(),
  indicator: sceneRail.indicator(),
  separator: sceneRail.separator()
}));
</script>
