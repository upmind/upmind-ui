<template>
  <div
    role="alert"
    :class="failureStrip({ isLeaving })"
    class="text-danger flex items-center gap-3 text-sm"
  >
    <span>{{ message }}</span>
    <Link
      color="danger"
      size="sm"
      :disabled="!canRetry"
      :data-attrs="{ 'data-test-value': 'retry' }"
      @click="canRetry && emit('retry')"
    >
      {{ t("action.retry") }}
    </Link>
    <Link
      color="danger"
      size="sm"
      :data-attrs="{ 'data-test-value': 'dismiss' }"
      @click="emit('dismiss')"
    >
      {{ t("action.dismiss") }}
    </Link>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/RowFailure
 * @description The verdict on ONE record — the slim strip that says which row
 * an action was refused on and why, under the row it belongs to (`E12`/`H6`).
 * MUTED, never a second box: the record's ring already encloses the pair, so a
 * bordered alert inside it draws a frame within a frame (operator ruling
 * 2026-08-13, refining `H8` — the muted wash is the sanctioned treatment).
 *
 * A toast is a corner of the screen the user was not looking at, and it leaves;
 * this stays where the user IS looking, but not forever: it fades out on the
 * toast's own clock, so the two verdicts of one action leave together
 * (operator ruling 2026-08-13). Dismiss remains for the user who has read it
 * sooner. One component because the table, the card grid and the read-only
 * list all owe the same sentence, and a second copy is how they drift.
 *
 * `role="alert"` because the strip's only other signal is colour — a refusal
 * nobody is told about is a refusal only sighted users receive.
 */

import { Link } from "@upmind/ui";
import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { failureStrip } from "./ListSurface.styles";
import type { RowFailureProps } from "./ListSurface.types";
// -----------------------------------------------------------------------------

/** sonner's own default display time — the toast this strip aligns with. */
const TOAST_DISPLAY_MS = 4000;

/** Long enough to read as a fade, short enough to not outstay the toast. */
const FADE_MS = 500;

defineProps<RowFailureProps>();

const emit = defineEmits<{
  /** The user wants to try the action again. */
  retry: [];
  /** The user has read it — the row returns to rest. */
  dismiss: [];
}>();

const { t } = useI18n();

const isLeaving = ref(false);

let fade: ReturnType<typeof setTimeout> | undefined;
let leave: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  fade = setTimeout(() => {
    isLeaving.value = true;
    leave = setTimeout(() => emit("dismiss"), FADE_MS);
  }, TOAST_DISPLAY_MS);
});

onUnmounted(() => {
  clearTimeout(fade);
  clearTimeout(leave);
});
</script>
