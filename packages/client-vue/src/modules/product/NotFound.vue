<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      open
      modal
      :title="t('cart.product_not_found_md')"
      :text="t('error.product_not_found')"
      :actions="[
        {
          ...storefrontRoute,
          variant: 'solid',
          color: 'primary',
          icon: 'arrow-left',
          label: t('action.continue_shopping')
        }
      ]"
      :animatedIcon="{
        icon: 'basket',
        delay: 5000,
        primaryColor: 'primary',
        secondaryColor: 'accent',
        size: '4xl'
      }"
    >
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useBrand } from "@upmind-automation/headless";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { storefrontRoute } = useBrand();
</script>
