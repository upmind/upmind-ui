<template>
  {{
    t("action.pay_today", {
      amount: props.price.currentPrice
    })
  }}.
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { TermDetails } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<{
  price: TermDetails["price"];
}>();
</script>
