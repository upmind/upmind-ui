<template>
  <Alert
    :title="
      isMobile
        ? t('cart.basket_product_missing_data')
        : t('cart.basket_product_missing_data_help')
    "
    color="danger"
    icon="alert-octagon"
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
import { computed } from "vue";

// --- components
import { Alert, Link } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  id: string;
  editRoute: RouteLocationAsRelativeGeneric;
}>();

// -----------------------------------------------------------------------------
const { t } = useI18n();
</script>
