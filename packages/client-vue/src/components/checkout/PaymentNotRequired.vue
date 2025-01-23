<template>
  <div
    class="flex flex-col items-center justify-between p-5 px-6 md:flex-row md:p-8 md:px-9"
  >
    <div class="w-full">
      <div class="text-primary font-medium">
        {{ t("payment.noPayment.title") }}
      </div>
      <div class="text-primary">
        {{ t("payment.noPayment.text") }}
      </div>
      <Button
        class="mt-4"
        :label="t('basket.summary.actions.submitNoPayment')"
        color="secondary"
        @click="checkout"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- components
import { Button } from "@upmind-automation/upwind";

// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket } from "@upmind-automation/headless-vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();
// ---
const { checkout } = useBasket();
</script>
