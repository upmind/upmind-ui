<template>
  <UpmCard class="h-full w-full !p-0" :disabled="props.disabled">
    <div class="flex h-full flex-col">
      <!-- Image section -->
      <div class="aspect-video shrink-0 overflow-hidden rounded-t-lg">
        <img
          v-if="imgUrl"
          class="m-0 h-full w-full object-cover object-center"
          :src="imgUrl"
          alt="Recommendation"
        />
        <div
          v-else
          class="from-promotion to-promotion-200 h-full w-full bg-gradient-to-br"
        />
      </div>

      <!-- Content section -->
      <div class="flex flex-1 flex-col gap-4 p-6 text-sm font-medium leading-6">
        <!-- Title and description -->
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-2">
            <h3 class="text-md m-0 font-medium">
              {{ name }}
            </h3>

            <Lineclamp
              v-if="description"
              class="text-emphasis-medium m-0 min-h-12 text-sm leading-6"
              :lines="2"
              :labelMore="t('product.actions.more', 1)"
              :labelLess="t('product.actions.more', 0)"
            >
              {{ description }}
            </Lineclamp>
          </div>
        </div>

        <!-- Spacer to push promotion, price and button to bottom -->
        <div class="-my-2 flex-1"></div>

        <div class="flex flex-col gap-2">
          <span
            v-for="promotion in promotions"
            :key="promotion.id"
            class="shrink-0"
          >
            <Promotion
              :discounted="meta?.discounted"
              :currentSaving="promotion.currentSaving"
              :currentSavingAmount="promotion.currentSavingAmount"
              size="xs"
            />
          </span>

          <!-- Price section -->
          <div class="flex items-center text-xl font-bold leading-6">
            <span v-if="meta?.free || monthlyFromCurrentAmount === 0">
              {{ t("recommendations.card.free") }}
            </span>
            <span v-else class="flex items-center">
              {{ t("recommendations.card.price.prefix") }}
              {{ monthlyFromCurrentPrice }}
            </span>

            <s
              v-if="monthlyFromCurrentAmount < monthlyFromRegularAmount"
              class="text-emphasis-medium ml-2 text-sm"
              >{{ monthlyFromRegularPrice }}</s
            >
          </div>
        </div>

        <!-- Button section -->
        <div>
          <Button
            color="primary"
            size="sm"
            :disabled="meta?.added"
            :loading="meta?.processing"
            :label="
              meta?.added
                ? t('recommendations.card.added')
                : label || t('recommendations.card.add')
            "
            block
            @click="doResolve(id)"
          >
            <template #prepend>
              <Icon v-if="meta?.added" icon="check" size="2xs" />
            </template>
          </Button>
        </div>
      </div>
    </div>
  </UpmCard>
</template>

<script lang="ts" setup>
// --- external
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal

// ---components
import { UpmCard } from "@upmind-automation/client-vue";
import { Button, Lineclamp, Icon } from "@upmind-automation/upwind";
import Promotion from "../basket/product/components/Promotion.vue";

// --- utils

// --- types
import type { Recommendation } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const { t } = useI18n();

const props = defineProps<
  Recommendation & {
    disabled?: boolean;
  }
>();

const emit = defineEmits<{
  (e: "resolve", value: string): void;
}>();

const doResolve = async (value: string) => {
  emit("resolve", value);
};
</script>
