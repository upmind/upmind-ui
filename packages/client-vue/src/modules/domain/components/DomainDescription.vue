<template>
  <p class="m-0">
    <Description as="span">
      <template v-if="meta.owned">{{
        t("domain.card.owned.description")
      }}</template>

      <template v-if="meta.added"
        >{{ t("domain.card.basket.description") }}
      </template>

      <template v-else-if="meta?.available && !meta.owned">
        <template v-if="meta.discounted">
          {{
<<<<<<< Updated upstream
            t("domain.card.available.description.discounted", [
              price.regularPrice,
              price.currentPrice,
            ])
=======
            t("domain.card.available.description.discounted", {
              regularPrice: price.regularPrice,
              currentPrice: price.currentPrice,
              count: Math.floor((props.cycle ?? 0) / 12)
            })
>>>>>>> Stashed changes
          }}
        </template>
        <template v-else>
          {{
            t("domain.card.available.description.regular", {
              regularPrice: price.regularPrice,
              currentPrice: price.currentPrice,
              count: Math.floor((props.cycle ?? 0) / 12),
            })
          }}
        </template>
      </template>
    </Description>
  </p>
</template>

<script setup lang="ts">
// components
import Description from "../../../components/content/Description.vue";

// --- external
import { useI18n } from "vue-i18n";

// --- utils

// --- types
import type { DomainSummaryProps } from "../types";

const props = defineProps<DomainSummaryProps>();

const emit = defineEmits(["update"]);

const { t } = useI18n();
</script>
