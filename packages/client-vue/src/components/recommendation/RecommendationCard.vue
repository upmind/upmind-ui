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
      <div class="flex flex-1 flex-col justify-between space-y-8 p-6">
        <div
          class="flex flex-1 flex-col justify-between gap-y-8 text-sm font-medium leading-6"
        >
          <!-- Title and description -->
          <div class="flex flex-col gap-x-2">
            <div class="flex flex-col gap-2">
              <h3 class="m-0 text-2xl font-semibold">
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

          <!-- Price section -->
          <div class="flex flex-col gap-y-2">
            <div class="flex items-center space-x-2">
              <s
                v-if="currentAmount < regularAmount"
                class="text-emphasis-disabled text-sm italic"
                >Was {{ regularPrice }}</s
              >

              <template v-for="promotion in promotions" :key="promotion.id">
                <Promotion
                  :discounted="meta?.discounted"
                  :currentSaving="promotion.amountFormatted"
                  :currentSavingAmount="promotion.amount"
                  size="xs"
                />
              </template>
            </div>

            <div class="flex items-baseline leading-6">
              <span class="text-3xl font-bold">
                <template v-if="meta?.free || monthlyFromCurrentAmount === 0">
                  {{ t("recommendations.card.free") }}
                </template>
                <template v-else>
                  {{ currentPrice }}
                </template>
              </span>
              <span
                v-if="!meta?.free && currentAmount && currentAmount > 0"
                class="text-emphasis-medium ml-1 text-sm lowercase leading-none"
                >/ {{ t(`recommendations.terms.${cycle}`) }}</span
              >
            </div>
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
import { useI18n } from "vue-i18n";

// ---components
import { UpmCard } from "@upmind-automation/client-vue";
import { Button, Lineclamp, Icon } from "@upmind-automation/upwind";
import Promotion from "../basket/product/components/Promotion.vue";

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
