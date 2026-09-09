<template>
  <form
    :class="COMPOSER_MODULE_CLASS"
    v-bind="useTestAttrs({ key: 'portal-composer' })"
    @submit.prevent="onSubmit"
  >
    <Textarea
      v-model="draft"
      :aria-label="props.label"
      :placeholder="props.placeholder"
      :rows="3"
      @keydown.enter.exact="onEnter"
      @keydown.enter.shift.exact="onShiftEnter"
    />
    <div :class="COMPOSER_CONTROLS_CLASS">
      <Input
        v-model="attachments"
        :class="COMPOSER_ATTACHMENTS_CLASS"
        :aria-label="props.attachmentsLabel"
        :placeholder="props.attachmentsPlaceholder"
      />
      <div :class="COMPOSER_ACTIONS_CLASS">
        <PortalButton
          type="button"
          variant="outline"
          size="sm"
          @click="onOptions"
        >
          {{ props.optionsLabel }}
        </PortalButton>
        <PortalButton type="submit" size="sm">
          {{ props.submitLabel }}
        </PortalButton>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/composer/Composer
 * @description The `composer` module — a message, the files named beside it
 * and the two controls legacy drew under them, emitting `select` with
 * `${action}:${json}` for the action seam (mock/actions.ts). An empty draft
 * never emits; a sent draft clears, attachments and all.
 *
 * The send key follows the client's own post options: one of Enter and
 * Shift+Enter sends, the other starts a new line, and neither sends while the
 * shortcut is off — the three states legacy's `onEnter` / `onShiftAndEnter`
 * ran off its new-line picker and its shortcut tick box.
 */
import {
  Button as PortalButton,
  Input,
  Textarea,
  useTestAttrs
} from "@upmind/ui";
import { ref } from "vue";
import { COMPOSER_SUBMIT_KEY } from "./types";
import {
  COMPOSER_ACTIONS_CLASS,
  COMPOSER_ATTACHMENTS_CLASS,
  COMPOSER_CONTROLS_CLASS,
  COMPOSER_MODULE_CLASS
} from "./variants";
import type {
  ComposerModuleEmits,
  ComposerModuleProps,
  ComposerSubmitKey
} from "./types";

defineOptions({ name: "PortalComposer" });

const props = defineProps<ComposerModuleProps>();
const emits = defineEmits<ComposerModuleEmits>();

const draft = ref("");
const attachments = ref("");

function onSubmit() {
  const body = draft.value.trim();
  if (body === "") return;
  emits(
    "select",
    `${props.action}:${JSON.stringify({ body, attachments: attachments.value.trim() })}`
  );
  draft.value = "";
  attachments.value = "";
}

/** Whether the key just pressed is the one this client sends with. */
function sendsOn(key: ComposerSubmitKey): boolean {
  if (props.submitWithShortcut !== true) return false;
  return (props.submitKey ?? COMPOSER_SUBMIT_KEY.ENTER) === key;
}

/** Plain Enter — the `.exact` modifier leaves the Shift pair to its own handler. */
function onEnter(event: KeyboardEvent) {
  if (!sendsOn(COMPOSER_SUBMIT_KEY.ENTER)) return;
  event.preventDefault();
  onSubmit();
}

/** Shift and Enter — the send key for a client whose new line is on Enter. */
function onShiftEnter(event: KeyboardEvent) {
  if (!sendsOn(COMPOSER_SUBMIT_KEY.SHIFT_ENTER)) return;
  event.preventDefault();
  onSubmit();
}

function onOptions() {
  emits("select", props.optionsValue);
}
</script>
