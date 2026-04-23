<template>
  <Alert
    v-if="meta.hasWarningNotes && !meta.isLoading"
    v-auto-animate
    color="warning"
    variant="minimal"
    icon="alert-triangle"
    :title="t('cart.warning_notes_title', warningNotes.length)"
    :action="{ label: t('action.dismiss_all') }"
    @click="dismissAllWarnings"
  >
    <template #description>
      <ul :class="styles.basketWarnings.list" v-auto-animate>
        <li
          v-for="note in warningNotes"
          :key="note.id"
          :class="styles.basketWarnings.item"
        >
          {{ note.message }}
        </li>
      </ul>
    </template>
  </Alert>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import { Alert, useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import { useBasket } from "@upmind-automation/headless";
import config from "./basket-warnings.config";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, warningNotes, dismissAllWarnings } = useBasket();

const styles = useStyles(["basketWarnings"], {}, config);
</script>
