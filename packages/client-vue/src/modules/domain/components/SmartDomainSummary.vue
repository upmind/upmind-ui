<template>
  <section :class="styles.field.summary.root">
    <RadioGroup model-value="selected">
      <div :class="styles.field.summary.row">
        <RadioGroupItem value="selected" />
        <span :class="styles.field.summary.domain">{{ domain }}</span>
        <Link :class="styles.field.summary.change" @click="emit('change')">
          {{ t("action.change") }}
        </Link>
      </div>
    </RadioGroup>
  </section>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  useStyles,
  RadioGroup,
  RadioGroupItem,
  Link
} from "@upmind-automation/upmind-ui";
import config from "../smartDomainField.config";
import type { SmartDomainSummaryProps } from "../types";

// -----------------------------------------------------------------------------

defineProps<SmartDomainSummaryProps>();

const emit = defineEmits<{
  (e: "change"): void;
}>();

const { t } = useI18n();

const styles = useStyles(["field.summary"], {}, config);
</script>
