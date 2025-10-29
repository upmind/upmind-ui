<template>
  <p class="text-muted m-0 text-sm">
    <template v-if="meta.owned">{{ t("confirm.domain_owned_msg") }}</template>

    <template v-if="meta.added"
      >{{ t("confirm.domain_in_basket_msg") }}
    </template>

    <template v-else-if="meta?.available && !meta.owned">
      <template v-if="meta.discounted">
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
  </p>
</template>

<script setup lang="ts">
// components

// --- external
import { useI18n } from "vue-i18n";

// --- utils

// --- types
import type { DomainSummaryProps } from "../types";

const props = defineProps<DomainSummaryProps>();

const emit = defineEmits(["update"]);

const { t } = useI18n();
</script>
