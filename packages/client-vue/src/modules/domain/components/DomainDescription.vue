<template>
  <template v-if="!meta.isAvailable">
    <template v-if="meta.isDiscounted">
      {{
        t("domain.transfer_promotion", {
          currentPrice: price.currentPrice,
          regularPrice: price.regularPrice
        })
      }}
    </template>
    <template v-else>
      {{
        t("domain.transfer", {
          currentPrice: price.currentPrice
        })
      }}
    </template>
  </template>

  <template v-else-if="meta.isOwned">{{
    t("confirm.domain_owned_msg")
  }}</template>

  <template v-else-if="meta.isAdded">
    {{ t("confirm.domain_in_basket_msg") }}
  </template>

  <template v-else-if="!meta.isOwned">
    <template v-if="meta.isDiscounted">
      {{
        t("text.price_change_desc", {
          regularPrice: price.regularPrice,
          currentPrice: price.currentPrice,
          count: Math.floor((props.cycle ?? 0) / 12)
        })
      }}
    </template>
    <template v-else>
      {{
        t("domain.price_renewal_desc", {
          regularPrice: price.regularPrice,
          currentPrice: price.currentPrice,
          count: Math.floor((props.cycle ?? 0) / 12)
        })
      }}
    </template>
  </template>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- utils

// --- types
import type { DomainSummaryProps } from "../types";

const props = defineProps<DomainSummaryProps>();

const emit = defineEmits(["update"]);

const { t } = useI18n();
</script>
