<template>
  <div :class="styles.summary.item.root">
    <dt :class="styles.summary.item.term">
      {{ t("text.basket_total") }}
    </dt>
    <dd :class="styles.summary.item.description">
      <Skeleton
        v-if="meta.isPricesCalculating"
        :class="styles.summary.item.skeleton"
      />
      <template v-else>
        {{
          formatPrice(summary?.total, {
            zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
            trimTrailingZeroes: data.trimTrailingZeroes
          })
        }}
      </template>
    </dd>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBasket, useConfig } from "@upmind-automation/headless";
import { useMoney } from "@upmind-automation/headless";
import { Skeleton, useStyles } from "@upmind-automation/upmind-ui";
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
const { summary, meta } = useBasket();
const { ui, data } = useConfig();
const { formatPrice } = useMoney();

const styles = useStyles(
  ["summary", "summary.item"],
  { footer: props.footer },
  config
);
</script>
