<template>
  <div :class="styles.field.summary.root">
    <div :class="styles.field.summary.row">
      <div
        class="flex min-w-[160px] flex-1 flex-wrap items-center gap-x-4 gap-y-1"
      >
        <span :class="styles.field.summary.domain">{{ domain }}</span>

        <button
          type="button"
          :class="styles.field.summary.change"
          @click="emit('change')"
        >
          {{ t("action.change") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../smartDomainField.config";

// -----------------------------------------------------------------------------

defineProps<{
  domain: string;
}>();

const emit = defineEmits<{
  (e: "change"): void;
}>();

const { t } = useI18n();

const styles = useStyles(["field.summary"], {}, config);
</script>
