<template>
  <!-- One self-wrapping price unit (mirrors the lib's OptionTilePrice) so the
       tile's #trailing slot gets a single item that wraps between tokens rather
       than several loose elements that overflow the row. -->
  <!-- items-center, not items-baseline: the current-price token is a flex group
       (swap icon + price), whose baseline is the icon edge rather than the text,
       so baseline-aligning it against the plain strikethrough price misaligns
       them. All tokens are the same size, so centring lines them up cleanly. -->
  <span
    v-if="!props.meta?.free || props.meta?.overrides"
    class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5"
  >
    <ExPrice
      :regular-price="props.price?.regularPrice ?? ''"
      :monthly-from-regular-price="props.price?.monthlyFromRegularPrice ?? ''"
      :discounted="props.meta?.discounted ?? false"
      :custom="props.meta?.custom"
      :ui-config="{ pricing: { ex: ['text-sm'] } }"
    >
      <template v-if="!props.meta?.overrides" #prefix>+</template>
    </ExPrice>

    <!-- overrides: the price was manually changed; flag it with a tooltip -->
    <Tooltip v-if="props.meta?.overrides && props.price">
      <span class="inline-flex items-center gap-1 hover:cursor-help">
        <Icon icon="switch-horizontal-01" size="xs" class="text-inherit" />
        <CurrentPrice
          :current-price="props.price?.currentPrice ?? ''"
          :monthly-from-current-price="
            props.price?.monthlyFromCurrentPrice ?? ''
          "
          :free="props.meta?.free ?? false"
          :ui-config="{
            pricing: { current: ['text-sm font-medium text-body'] }
          }"
        />
        <span v-if="isOneoff" class="text-muted ml-1 text-sm">{{
          lowerCase(t("term.one_time"))
        }}</span>
      </span>
      <template #content>{{ t("text.overrides_price") }}</template>
    </Tooltip>

    <Tooltip v-else>
      <span class="inline-flex items-center gap-1 hover:cursor-help">
        <CurrentPrice
          :current-price="props.price?.currentPrice ?? ''"
          :monthly-from-current-price="
            props.price?.monthlyFromCurrentPrice ?? ''
          "
          :free="props.meta?.free ?? false"
          :ui-config="{
            pricing: { current: ['text-sm font-medium text-body'] }
          }"
        >
          <template #prefix>+</template>
        </CurrentPrice>
        <span v-if="isOneoff" class="text-muted ml-1 text-sm">{{
          lowerCase(t("term.one_time"))
        }}</span>
      </span>
      <template #content>{{ t("text.adds_to_price") }}</template>
    </Tooltip>
  </span>
</template>

<script setup lang="ts">
import { Tooltip } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "../../../../components/icon";
import CurrentPrice from "../pricing/CurrentPrice.vue";
import ExPrice from "../pricing/ExPrice.vue";
import { lowerCase } from "lodash-es";
import type { SubproductValue } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
// Trimmed price line for an option tile's trailing slot: free (renders nothing),
// regular + current, manual override (tooltip) and one-off ("one time") — the
// SubproductCard pricing behaviour, token-styled and without the dropdown
// distinction the tile layout now owns.

const props = defineProps<{
  price: SubproductValue["price"];
  meta?: SubproductValue["meta"];
  term?: number;
}>();

const { t } = useI18n();

const isOneoff = computed(
  () =>
    !!props.meta?.oneoff && !!props.term && props.term > 0 && !props.meta.free
);
</script>
