<template>
  <div
    role="group"
    :aria-label="t('labs.transport')"
    data-test-key="transport"
    :class="transport.root()"
  >
    <Tooltip
      v-for="control in controls"
      :key="control.key"
      :label="control.label"
      active
    >
      <ButtonItems
        icon-only
        size="sm"
        :variant="control.color"
        :icon="control.icon"
        :label="control.label"
        :disabled="control.disabled"
        :loading="control.loading"
        :data-attrs="{
          'data-test-key': 'transport-control',
          'data-test-value': control.key
        }"
        @click="select(control)"
      />
    </Tooltip>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/Transport
 * @description The media bar's instrument: step back · play/pause · step
 * forward · stop over the armed track's scenes (`AC2.5`, `R7-9`).
 * Presentational only — it
 * holds no playhead, arms nothing and knows no track; it asks the player for
 * the call each control is named after and draws what the player answers, so
 * the same DOM node the scenario bar morphs into never grows a second source of
 * truth (`AC2.2`).
 *
 * Play and pause are ONE control in two states, as they are on every transport
 * ever built: the same button, the same place, the icon and the tooltip swapping
 * with `playing`. A control with nothing left to do is disabled rather than
 * absent, so the cluster never changes width mid-track.
 *
 * The treatment is the primary/secondary token family throughout — the playing
 * surface is never warning-yellow (`H2`, `AC2.8`).
 */

import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Tooltip } from "@upmind/ui";
import ButtonItems from "./ButtonItems.vue";
import { transport } from "./Transport.styles";
import { TRANSPORT_CONTROL } from "./Transport.types";
import type {
  TransportControl,
  TransportControlItem,
  TransportEmits,
  TransportProps
} from "./Transport.types";
// -----------------------------------------------------------------------------

const props = defineProps<TransportProps>();
const emit = defineEmits<TransportEmits>();

const { t } = useI18n();

// The one thing the player cannot tell us: which control the hand touched. A
// scene runs asynchronously, so without it a pressed control reads as dead
// (`E12`/`S14`) — and it is deliberately NOT held on play/pause, whose key
// swaps the moment playback starts, leaving that button live to pause with.
const pressed = ref<TransportControl>();

const atEnd = computed(() => props.playhead >= props.sceneCount - 1);

const controls = computed<TransportControlItem[]>(() => [
  {
    key: TRANSPORT_CONTROL.PREV,
    icon: "skip-back",
    label: t("labs.transport_step_back"),
    color: "secondary",
    disabled: props.playhead <= 0,
    loading: !!props.busy && pressed.value === TRANSPORT_CONTROL.PREV,
    onSelect: () => emit("prev")
  },
  props.playing
    ? {
        key: TRANSPORT_CONTROL.PAUSE,
        icon: "pause-circle",
        label: t("labs.transport_pause"),
        color: "primary",
        disabled: false,
        loading: false,
        onSelect: () => emit("pause")
      }
    : {
        key: TRANSPORT_CONTROL.PLAY,
        icon: "play-circle",
        label: t("labs.transport_play"),
        color: "primary",
        disabled: atEnd.value,
        loading: !!props.busy && pressed.value === TRANSPORT_CONTROL.PLAY,
        onSelect: () => emit("play")
      },
  {
    key: TRANSPORT_CONTROL.NEXT,
    icon: "skip-forward",
    label: t("labs.transport_step_forward"),
    color: "secondary",
    disabled: atEnd.value,
    loading: !!props.busy && pressed.value === TRANSPORT_CONTROL.NEXT,
    onSelect: () => emit("next")
  },
  // Never disabled, at either end of the track: it is the way OUT, and an exit
  // that greys out on the last scene traps the surface in a playback (`R7-9`).
  {
    key: TRANSPORT_CONTROL.STOP,
    icon: "stop-circle",
    label: t("labs.transport_stop"),
    color: "secondary",
    disabled: false,
    loading: !!props.busy && pressed.value === TRANSPORT_CONTROL.STOP,
    onSelect: () => emit("stop")
  }
]);

function select(control: TransportControlItem): void {
  pressed.value = control.key;
  control.onSelect();
}
</script>
