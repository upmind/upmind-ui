<template>
  <Alert
    :title="
      isMobile
        ? t('cart.basket_product_missing_data')
        : t('cart.basket_product_missing_data_help')
    "
    variant="warning"
    :action="{
      label: isMobile ? t('action.fix') : t('action.add_missing_data'),
      dataAttrs: { 'data-test-key': 'link-add-missing-data' },
      ...props.editRoute
    }"
  >
    <template #icon><Icon icon="alert-triangle" /></template>
  </Alert>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Alert } from "@upmind/ui";
import { Icon } from "../../../../../components/icon";
import { isMobile } from "../../../../../composables/isMobile";
import type { RequiredAlertProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<RequiredAlertProps>();

// -----------------------------------------------------------------------------
const { t } = useI18n();
</script>
