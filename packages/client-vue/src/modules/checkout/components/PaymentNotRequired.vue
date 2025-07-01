<template>
  <div
    class="flex flex-col items-center justify-between p-5 px-6 md:flex-row md:p-8 md:px-9"
  >
    <div class="w-full">
      <div class="text-foreground font-medium">
        {{ t("payment.noPayment.title") }}
      </div>
      <div class="text-base-foreground">
        {{ t("payment.noPayment.text") }}
      </div>
      <Button
        class="mt-4"
        :label="t('payment.noPayment.action')"
        color="primary"
        @click="checkout"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- components
import { Button } from "@upmind-automation/upmind-ui";

// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const { t } = useI18n();
// ---
const { checkout } = useBasket();
</script>
