<template>
  <Alert
    v-if="meta.showErrors"
    :title="t('error.product_not_valid')"
    :description="t('text.check_required_fields_desc')"
    icon="alert-triangle"
    color="danger"
  />
</template>

<script setup lang="ts">
// --- external
import { type UseProductConfigMeta } from "@upmind-automation/headless";
import { useI18n } from "vue-i18n";

// --- components
import { Alert } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

defineProps<{
  meta: UseProductConfigMeta;
}>();

const { t } = useI18n();
</script>
