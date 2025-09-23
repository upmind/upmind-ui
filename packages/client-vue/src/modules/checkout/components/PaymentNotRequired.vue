<template>
  <div
    class="flex flex-col items-center justify-between p-5 px-6 md:flex-row md:p-8 md:px-9"
  >
    <div class="w-full">
      <div class="text-foreground font-medium">
        {{ t("cart.nothing_to_pay_msg") }}
      </div>
      <div class="text-base-foreground">
        {{ t("cart.place_order_desc") }}
      </div>
      <Button
        class="mt-4"
        :label="t('action.place_order')"
        color="primary"
        size="lg"
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
