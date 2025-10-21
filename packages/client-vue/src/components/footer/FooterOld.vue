<template>
  <footer
    class="bg-surface shadow-t-border-surface w-full px-6 py-6 text-base"
    data-testid="footer"
  >
    <div
      class="max-w-app divide-border-surface mx-auto flex w-full flex-col divide-y [&>*]:py-6"
    >
      <section
        class="flex justify-center gap-2 md:justify-end"
        aria-label="Language and currency preferences"
      >
        <UpmLocale data-testid="locale-selector" />
        <UpmCurrency data-testid="currency-selector" />
      </section>

      <section
        class="flex flex-col justify-between gap-2 text-center md:flex-row md:gap-0 md:text-left"
      >
        <PoweredByUpmind />

        <Copyright />
      </section>
    </div>
  </footer>
</template>

<script lang="ts" setup>
// --- components
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import UpmLocale from "../../components/LocaleSwitcher.vue";
import PoweredByUpmind from "./PoweredByUpmind.vue";
import Copyright from "./Copyright.vue";
</script>
