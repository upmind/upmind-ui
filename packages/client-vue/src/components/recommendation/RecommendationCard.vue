<template>
  <UpmCard :class="styles.recommendation.root" :disabled="props.disabled">
    <RecommendationBadge :badge="badge" />

    <div :class="styles.recommendation.container">
      <!-- Image section -->
      <div :class="styles.recommendation.imageContainer">
        <img
          v-if="imgUrl"
          :class="styles.recommendation.image"
          :src="imgUrl"
          alt="Recommendation"
        />
        <div v-else :class="styles.recommendation.imagePlaceholder" />
      </div>

      <!-- Content section -->
      <div :class="styles.recommendation.content">
        <div :class="styles.recommendation.contentDescription">
          <!-- Title and description -->
          <div class="flex flex-col gap-x-2">
            <div class="flex flex-col gap-2">
              <h3 :class="styles.recommendation.title">
                {{ name }}
              </h3>

              <Lineclamp
                v-if="description"
                :class="styles.recommendation.description"
                :lines="2"
                :labelMore="t('product.actions.more', 1)"
                :labelLess="t('product.actions.more', 0)"
                >{{ description }}</Lineclamp
              >
            </div>

            <RecommendationBenefits :benefits="benefits" class="mt-6" />
          </div>

          <!-- Price section -->
          <div :class="styles.recommendation.priceContainer">
            <!-- Price Intro: eg. 'From' or 'Was $X.XX' -->
            <div class="flex items-center space-x-2">
              <p :class="styles.recommendation.priceIntro">
                <!-- If discounted, show regular price -->
                <template v-if="meta?.discounted">
                  <del>{{
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
              <span :class="styles.recommendation.priceCurrent">
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
                <span :class="styles.recommendation.priceTerm">{{
                  ` / ${t(`recommendations.terms.month`).toLocaleLowerCase()}`
                }}</span>
              </template>
            </div>

            <!-- Summary (If there is a billing cycle) -->
            <template v-if="!!cycle">
              <p :class="styles.recommendation.priceSummary">
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
import { computed, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upwind";
import config from "./config.cva";

// --- components
import { Button, Lineclamp, Icon } from "@upmind-automation/upwind";
import { UpmCard } from "@upmind-automation/client-vue";
import Promotion from "../basket/product/components/Promotion.vue";
import RecommendationBadge from "./components/Badge.vue";
import RecommendationBenefits from "./components/Benefits.vue";

// --- types
import type { Recommendation } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<
  Recommendation & {
    disabled?: boolean;
    badge?: string;
    benefits?: string[];
  }
>();

const configMeta = computed(() => ({
  disabled: props.disabled,
}));

const styles = useStyles(
  ["recommendation"],
  configMeta,
  config
) as ComputedRef<{
  recommendation: {
    root: string;
    container: string;
    imageContainer: string;
    image: string;
    imagePlaceholder: string;
    content: string;
    contentDescription: string;
    title: string;
    description: string;
    priceContainer: string;
    priceIntro: string;
    priceCurrent: string;
    priceTerm: string;
    priceSummary: string;
  };
}>;

const emit = defineEmits<{
  (e: "resolve", value: string): void;
}>();

const doResolve = async (value: string) => {
  emit("resolve", value);
};
</script>
