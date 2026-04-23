<template>
  <div :class="styles.domainRegistrant.field.root">
    <span :class="styles.domainRegistrant.field.label">
      {{ label }}
      <span
        v-if="required && !value"
        :class="styles.domainRegistrant.field.required"
        >*</span
      >
    </span>
    <span :class="styles.domainRegistrant.field.value">
      {{ value || t("domain.missing_field") }}
    </span>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";

// --- config
import config from "../domain-registrant.config";

// --- types
import type { RegistrantFieldProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<RegistrantFieldProps>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const hasValue = computed(() => !!props.value);

const styles = useStyles(["domainRegistrant.field"], { hasValue }, config);
</script>
