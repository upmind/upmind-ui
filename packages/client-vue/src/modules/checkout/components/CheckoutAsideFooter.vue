<template>
  <Alert
    v-if="meta.hasErrors"
    color="danger"
    icon="alert-triangle"
    :title="t('error.checkout')"
    :description="errors?.message"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBasket } from "@upmind-automation/headless";
import { Alert } from "@upmind-automation/upmind-ui";

const { t } = useI18n();
const { meta, errors } = useBasket();
</script>
