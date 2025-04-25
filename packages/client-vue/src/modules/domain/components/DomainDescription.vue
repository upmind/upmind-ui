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
            t("domain.card.available.description.discounted", [
              price.regularPrice,
              price.currentPrice,
            ])
          }}
        </template>
        <template v-else>
          {{
            t("domain.card.available.description.regular", [price.currentPrice])
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

// --- types
import type { DomainSummaryProps } from "../types";

defineProps<DomainSummaryProps>();

const emit = defineEmits(["update"]);

const { t } = useI18n();
</script>
