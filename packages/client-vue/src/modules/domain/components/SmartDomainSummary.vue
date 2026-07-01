<template>
  <section
    :class="styles.field.summary.root"
    :data-disabled="disabled || undefined"
  >
    <RadioGroup model-value="selected">
      <div :class="styles.field.summary.row">
        <div :class="styles.field.summary.indicator">
          <RadioGroupItem value="selected" />
        </div>
        <span :class="styles.field.summary.domain">{{ domain }}</span>
        <Link
          :disabled="disabled"
          :class="styles.field.summary.change"
          @click="emit('change')"
        >
          {{ t("action.change") }}
        </Link>
      </div>
    </RadioGroup>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
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
