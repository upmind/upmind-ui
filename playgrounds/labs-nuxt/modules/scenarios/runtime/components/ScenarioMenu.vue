<template>
  <div :class="scenarioMenu.root()">
    <ToggleGroup
      type="single"
      :model-value="isLive ? TRACK_LIVE : undefined"
      size="sm"
      @update:model-value="
        v => v === TRACK_LIVE && emit('select', { kind: SCENARIO_CHOICE.LIVE })
      "
    >
      <ToggleGroupItem
        :value="TRACK_LIVE"
        :data-attrs="{
          'data-test-key': 'track',
          'data-test-value': TRACK_LIVE
        }"
      >
        {{ t("labs.track_live") }}
      </ToggleGroupItem>
    </ToggleGroup>

    <Select
      size="sm"
      :model-value="active"
      :items="items"
      :placeholder="t('labs.scenario_count', { count: size(tracks) })"
      :aria-label="t('labs.scenarios')"
      :class="scenarioMenu.trigger()"
      :ui="{ content: scenarioMenu.panel() }"
      :data-attrs="{
        'data-test-key': 'scenario-menu',
        'data-test-value': size(tracks)
      }"
      @update:model-value="pick"
    />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ScenarioMenu
 * @description The bar's whole playlist: Live, and ONE dropdown labelled with
 * the scenario count holding everything else (`R7-10`). There are no track chips
 * — a scenario name is a whole sentence, so a chip could only ever show a
 * truncated fragment of one, which is illegible and costs the bar the width the
 * transport needs.
 *
 * The forced states live in that same dropdown as their own group (`R7-11`): a
 * forced preset and a playing scenario are the same KIND of thing — a page in a
 * state it did not reach by itself — so the one menu is where a page's non-live
 * state is chosen, and the sheet toggle beside it stays about the sheets.
 *
 * Both groups are ONE `Select` because at most one non-live
 * state can ever be on: the armed track and the armed preset are alternatives,
 * and a radio group is what says so with the theme's own indicator rather than a
 * tick glyph bolted onto a list of words. Live is the group's absent value, and
 * it sits on the BAR rather than in the menu — the way back must not be behind
 * the control that took you away.
 *
 * It owns nothing but which way it is open. Which state is on is handed in, and
 * picking one is an emit saying what was chosen — the bar holds the player and
 * the worker, so it is the bar that decides what arming one costs the other.
 */

import { Select, ToggleGroup, ToggleGroupItem } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { FORCE_URL_PRESETS } from "../composables/useForcedState.types";
import { FORCE_PRESET_LABELS } from "./ForcedCanvas.types";
import { scenarioMenu } from "./ScenarioMenu.styles";
import { SCENARIO_CHOICE, TRACK_LIVE } from "./ScenarioMenu.types";
import { find, map, size } from "lodash-es";
import type {
  ScenarioMenuEmits,
  ScenarioMenuProps
} from "./ScenarioMenu.types";
import type { ForceUrlPreset } from "../composables/useForcedState.types";
import type { SelectOptionGroup } from "@upmind/ui";
// -----------------------------------------------------------------------------

const props = defineProps<ScenarioMenuProps>();
const emit = defineEmits<ScenarioMenuEmits>();

const { t } = useI18n();

// Namespaced because the two groups share one selection: a slug and a preset are
// both free-form words, and one select cannot hold two options answering to
// the same value.
const trackValue = (slug: string): string => `track:${slug}`;
const forceValue = (preset: ForceUrlPreset): string => `force:${preset}`;

const isLive = computed(() => !props.armed && !props.preset);

// Live is the ABSENT value, so the trigger falls back to its placeholder (the count).
const active = computed(() => {
  if (props.armed) return trackValue(props.armed.slug);

  const preset = find(FORCE_URL_PRESETS, entry => entry === props.preset);

  return preset ? forceValue(preset) : undefined;
});

const items = computed<SelectOptionGroup[]>(() => [
  {
    label: t("labs.force_preset"),
    options: map([...FORCE_URL_PRESETS], preset => ({
      value: forceValue(preset),
      label: t(FORCE_PRESET_LABELS[preset]),
      disabled: !!props.disabled,
      dataAttrs: {
        "data-test-key": "force-preset-option",
        "data-test-value": preset
      }
    }))
  },
  {
    label: t("labs.scenarios"),
    options: map(props.tracks, track => ({
      value: trackValue(track.slug),
      label: track.name,
      // A track the catalog cannot run whole is offered but refused, never hidden.
      disabled: !!props.disabled || !track.isPlayable,
      dataAttrs: {
        "data-test-key": "track-option",
        "data-test-value": track.slug
      }
    }))
  }
]);

function pick(value: unknown): void {
  if (value === active.value) return;

  const track = find(props.tracks, entry => trackValue(entry.slug) === value);
  if (track) return emit("select", { kind: SCENARIO_CHOICE.TRACK, track });

  const preset = find(FORCE_URL_PRESETS, entry => forceValue(entry) === value);
  if (preset) emit("select", { kind: SCENARIO_CHOICE.FORCE, preset });
}
</script>
