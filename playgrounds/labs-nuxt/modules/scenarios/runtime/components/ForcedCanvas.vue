<template>
  <div
    :class="forcedCanvas.root({ isForced })"
    data-test-key="forced-canvas"
    :data-test-value="preset"
  >
    <div v-if="preset" :class="forcedCanvas.header()">
      <Badge
        variant="primary"
        appearance="solid"
        size="sm"
        data-test-key="forced-preset"
      >
        {{ label }}
      </Badge>
    </div>

    <slot />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ForcedCanvas
 * @description The frame that makes a faked page unmistakable (`AC8.4`): with a
 * preset armed the WHOLE page carries an outline glow and a chip naming the
 * preset; on Live it carries neither, and clearing takes both away.
 *
 * Both halves resolve to the PRIMARY family and never the warning one (`H2`) —
 * a forced page is a state the developer asked for, and dressing it as a fault
 * would teach the eye to read a deliberate mode as something gone wrong.
 *
 * The treatment costs the page NO geometry (`R6-18`): an outline reserves no
 * space, so a column cannot move between Live and a forced state, and the chip
 * is the only thing in flow. It owns no state and reads no worker — the page
 * hands it `useForcedState`'s preset — so the frame can never claim a state the
 * worker is not serving.
 *
 * A preset that cannot show itself on arrival says so beside its own chip
 * (`R7-5`): `error-action` answers a WRITE, so until a row action is fired the
 * page is honestly unchanged, and an armed preset with nothing to point at reads
 * as a broken control. What it never does is fire that write itself to make the
 * state appear.
 */

import { Badge } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { forcedCanvas } from "./ForcedCanvas.styles";
import { FORCE_REPLAY_LABEL } from "./ForcedCanvas.types";
import type { ForcedCanvasProps } from "./ForcedCanvas.types";
// -----------------------------------------------------------------------------

const props = defineProps<ForcedCanvasProps>();

const { t } = useI18n();

// The state's OWN name, as its feature wrote it — never a word this app chose
// for it (operator ruling, 2026-09-12). Only `replay` has no scenario behind
// it, so only `replay` is named from a key here.
const label = computed(() => {
  if (!props.preset) return "";

  return t("labs.forced_preset", {
    preset: props.label || t(FORCE_REPLAY_LABEL)
  });
});

const isForced = computed(() => !!props.preset);
</script>
