<template>
  <footer
    class="bg-surface shadow-t-border-surface w-full py-6 text-base"
    data-testid="footer"
  >
    <div
      class="max-w-app divide-border-surface mx-auto flex w-full flex-col divide-y [&>*]:py-6"
    >
      <section
        class="flex flex-col justify-end gap-y-2.5 sm:flex-row sm:gap-x-2.5"
        aria-label="Language and currency preferences"
      >
        <UpmLocale data-testid="locale-selector" />
        <UpmCurrency data-testid="currency-selector" />
      </section>

      <section class="flex justify-between">
        <div class="text-muted flex w-full items-center gap-2 text-sm">
          <img
            v-if="upmindLogo"
            :src="upmindLogo"
            alt="Upmind logo"
            width="16"
            height="16"
          />
          <p>
            {{ t("text.powered_by") }}
            <Link
              color="inherit"
              href="https://upmind.com"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block underline underline-offset-2"
              >Upmind</Link
            >
          </p>
        </div>

        <p class="text-muted text-sm whitespace-nowrap">
          {{
            t("text.copyright", {
              year: new Date().getFullYear(),
              name
            })
          }}
        </p>
      </section>
    </div>
  </footer>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBrand } from "@upmind-automation/headless";

// --- components
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import UpmLocale from "../../components/LocaleSwitcher.vue";
import { Link } from "@upmind-automation/upmind-ui";

// --- assets
import upmindLogo from "../../assets/mark.svg";

const { t } = useI18n();
const { name } = useBrand();
</script>
