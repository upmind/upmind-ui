<template>
  <aside
    v-if="meta.hasWarningNotes && !meta.isLoading"
    class="w-full"
    v-auto-animate
  >
    <Alert
      color="warning"
      variant="minimal"
      icon="alert-triangle"
      :title="t('cart.warning_notes_title', { count: warningNotes.length })"
    >
      <ul class="text-sm-tight list-disc p-6 py-2 text-left" v-auto-animate>
        <li
          v-for="note in warningNotes"
          :key="note.id"
          class="text-sm marker:text-inherit"
        >
          {{ note.message }}
        </li>
      </ul>

      <template #actions>
        <Button
          size="sm"
          variant="ghost"
          :label="t('action.dismiss_all')"
          @click="dismissAllWarnings"
        />
      </template>
    </Alert>
  </aside>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import { Alert, Button } from "@upmind-automation/upmind-ui";

// --- internal
import { useBasket } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, warningNotes, dismissAllWarnings } = useBasket();
</script>
