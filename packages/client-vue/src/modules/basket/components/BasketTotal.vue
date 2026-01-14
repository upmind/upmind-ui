<template>
  <div :class="styles.summary.item.root">
    <dt :class="styles.summary.item.term">
      {{ t("text.basket_total") }}
    </dt>
    <dd :class="styles.summary.item.description">
      {{
        formatPrice(summary?.total, {
          zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
          trimTrailingZeroes: data.trimTrailingZeroes
        })
      }}
    </dd>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket, useConfig } from "@upmind-automation/headless";
import { useMoney } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./summary.config";

// --- types

const props = withDefaults(
  defineProps<{
    footer?: boolean;
  }>(),
  {
    footer: false
  }
);

const { t } = useI18n();
const { summary } = useBasket();
const { ui, data } = useConfig();
const { formatPrice } = useMoney();

const styles = useStyles(
  ["summary", "summary.item"],
  { footer: props.footer },
  config
);
</script>
