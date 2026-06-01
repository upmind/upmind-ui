<template>
  <Alert
    :title="
      isMobile
        ? t('cart.basket_product_missing_data')
        : t('cart.basket_product_missing_data_help')
    "
    color="warning"
    icon="alert-triangle"
    size="sm"
    :action="{
      label: isMobile ? t('action.fix') : t('action.add_missing_data'),
      ...props.editRoute
    }"
  />
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Alert } from "@upmind-automation/upmind-ui";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

// --- types
import type { RequiredAlertProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<RequiredAlertProps>();

// -----------------------------------------------------------------------------
const { t } = useI18n();
</script>
