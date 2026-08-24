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
import { useI18n } from "vue-i18n";
import { useBasket } from "@upmind-automation/headless";
import { Alert } from "@upmind/ui";
import { Icon } from "../../../components/icon";

const { t } = useI18n();
const { meta, errors } = useBasket();
</script>
