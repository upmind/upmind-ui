<template>
  <p class="m-0">
    <Description as="span">
      <template v-if="isOwned">{{
        t("domain.card.owned.description")
      }}</template>

      <template v-if="inBasket"
        >{{ t("domain.card.basket.description") }}
      </template>

      <template v-else-if="summary?.meta?.available && !isOwned">
        <template v-if="summary?.meta.discounted">
          {{
            t("domain.card.available.description.discounted", [
              summary?.regularPrice,
              summary?.currentPrice,
            ])
          }}
        </template>
        <template v-else>
          {{
            t("domain.card.available.description.regular", [
              summary?.currentPrice,
            ])
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
import type { DomainDescriptionProps } from "../types";

defineProps<DomainDescriptionProps>();

const emit = defineEmits(["update"]);

const { t } = useI18n();

const onUpdate = (domain: string) => {
  emit("update", domain);
};
</script>
