<template>
  <footer
    class="bg-base-background text-base-foreground w-full border-t p-6"
    data-testid="footer"
  >
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
          >{{ t("text.powered_by") }}
          <a
            href="https://upmind.com"
            target="_blank"
            class="inline-block underline"
            >Upmind</a
          ></span
        >
      </span>

      <div class="flex flex-col gap-y-2.5 sm:flex-row sm:gap-x-2.5">
        <UpmLocale data-testid="locale-selector" />
        <UpmCurrency data-testid="currency-selector" />
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import UpmLocale from "../../components/LocaleSwitcher.vue";
import upmindLogo from "../../assets/favicons/favicon.svg";

const { t } = useI18n();
</script>
