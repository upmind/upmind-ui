<template>
  <footer class="bg-base-background text-base-foreground w-full border-t p-6">
    <div
      class="max-w-app mx-auto flex w-full items-center justify-between md:justify-normal"
    >
      <span class="flex w-full items-center gap-x-2.5 text-sm font-medium">
        <img
          v-if="upmindLogo"
          :src="upmindLogo"
          class="h-4 w-auto"
          alt="logo"
        />
        <span
          >Powered by
          <a
            href="https://upmind.com"
            target="_blank"
            class="inline-block underline"
            >Upmind</a
          ></span
        >
      </span>

      <UpmCurrency data-testid="currency-selector" />
    </div>
  </footer>
</template>

<script lang="ts" setup>
// --- internal
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import upmindLogo from "../../assets/favicons/favicon.svg";
</script>
