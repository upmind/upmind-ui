<template>
  <Alert
    v-if="meta.hasErrors"
    variant="danger"
    :title="t('error.checkout')"
    :description="errors?.message"
  >
    <template #icon><Icon icon="alert-triangle" /></template>
  </Alert>
</template>

<script lang="ts" setup>
import { Alert } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/foundation";
import { useBasket } from "@upmind-automation/headless";

const { t } = useI18n();
const { meta, errors } = useBasket();
</script>
