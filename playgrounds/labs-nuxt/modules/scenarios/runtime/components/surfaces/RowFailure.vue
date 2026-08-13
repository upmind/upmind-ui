<template>
  <Alert
    color="danger"
    variant="minimal"
    size="sm"
    icon="alert-triangle"
    :title="message"
  >
    <template #action>
      <Button
        size="sm"
        variant="ghost"
        color="danger"
        icon="x-close"
        icon-only
        :label="t('action.dismiss')"
        :aria-label="t('action.dismiss')"
        @click="emit('dismiss')"
      />
    </template>
  </Alert>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/RowFailure
 * @description The verdict on ONE record — the slim strip that says which row
 * an action was refused on and why, under the row it belongs to (`E12`/`H6`).
 * Minimal, never a filled alert: the refusal is the row's ring plus this
 * sentence in the danger colour, and a wash is the treatment the ruling killed
 * (`H8`).
 *
 * A toast is a corner of the screen the user was not looking at, and it leaves:
 * the record it happened to keeps saying so until it is dismissed or the action
 * is tried again. One component because the table, the card grid and the
 * read-only list all owe the same sentence, and a second copy is how they drift.
 */

import { useI18n } from "vue-i18n";
import { Alert, Button } from "@upmind-automation/upmind-ui";
import type { RowFailureProps } from "./ListSurface.types";
// -----------------------------------------------------------------------------

defineProps<RowFailureProps>();

const emit = defineEmits<{
  /** The user has read it — the row returns to rest. */
  dismiss: [];
}>();

const { t } = useI18n();
</script>
