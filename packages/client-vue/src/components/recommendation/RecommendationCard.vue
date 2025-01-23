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
                class="text-emphasis-disabled m-0 min-h-12 text-sm leading-6"
                :lines="2"
                :labelMore="t('product.actions.more', 1)"
                :labelLess="t('product.actions.more', 0)"
                >{{ description }}</Lineclamp
              >
            </div>
          </div>

          <!-- Price section -->
          <div class="not-prose flex flex-col gap-y-2">
            <!-- Price Intro: eg. 'From' or 'Was $X.XX' -->
            <div class="flex items-center space-x-2">
              <p class="text-emphasis-disabled text-sm">
                <!-- If discounted, show regular price -->
                <template v-if="meta?.discounted">
                  <del class="italic">{{
                    t("recommendations.card.was_price", {
                      price: !!cycle ? monthlyFromRegularPrice : regularPrice,
                    })
                  }}</del>
                </template>

                <!-- Otherwise, show 'Only' -->
                <template v-else>
                  <span>{{ t("recommendations.card.only") }}</span>
                </template>
              </p>

              <template v-for="promotion in promotions" :key="promotion.id">
                <Promotion
                  :discounted="meta?.discounted"
                  :currentSaving="promotion.amountFormatted"
                  :currentSavingAmount="promotion.amount"
                  size="sm"
                />
              </template>
            </div>

            <div class="flex items-baseline">
              <!-- Current Price -->
              <span class="text-3xl font-bold">
                <template v-if="meta?.free">{{
                  t("recommendations.card.free")
                }}</template>
                <template v-else-if="!!cycle">{{
                  monthlyFromCurrentPrice
                }}</template>
                <template v-else>{{ currentPrice }}</template>
              </span>

              <!-- Term -->
              <template v-if="!!cycle">
                <span class="text-emphasis-medium ml-1 text-sm leading-none">{{
                  ` / ${t(`recommendations.terms.month`).toLocaleLowerCase()}`
                }}</span>
              </template>
            </div>

            <!-- Summary (If there is a billing cycle) -->
            <template v-if="!!cycle">
              <p class="text-emphasis-disabled mt-1 text-sm">
                {{
                  t(
                    meta?.discounted
                      ? "recommendations.card.discounted_summary"
                      : "recommendations.card.non_discounted_summary",
                    {
                      numericTerm: t(`recommendations.terms.numeric.${cycle}`),
                      descriptiveTerm: t(
                        `recommendations.terms.descriptive.${cycle}`
                      ).toLocaleLowerCase(),
                      currentPrice,
                      regularPrice,
                    }
                  )
                }}
              </p>
            </template>
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
import { useI18n } from "vue-i18n";
import UpmCard from "../content/Card.vue";
import { Button, Lineclamp, Icon } from "@upmind-automation/upwind";
import Promotion from "../basket/product/components/Promotion.vue";
import type { Recommendation } from "@upmind-automation/headless-vue";

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
