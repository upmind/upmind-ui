<template>
  <Card :class="styles.recommendation.root" :disabled="configMeta?.isDisabled">
    <Badge
      v-if="props.productDetails?.badge?.label"
      v-bind="props.productDetails.badge"
      variant="flat"
      size="lg"
      :class="styles.recommendation.badge"
    />

    <article :class="styles.recommendation.container">
      <!-- Image section -->
      <figure
        v-if="configMeta.hasImage"
        :class="styles.recommendation.image.root"
      >
        <img
          :class="styles.recommendation.image.image"
          :src="props.productDetails.imgUrl"
          :alt="`${props.productDetails.title} product image`"
        />
      </figure>

      <!-- Content -->
      <div :class="styles.recommendation.content.root">
        <header :class="styles.recommendation.content.breakdown">
          <!-- Title and description -->
          <section :class="styles.recommendation.content.details.root">
            <h3 :class="styles.recommendation.content.details.title">
              {{ props.productDetails.title }}
            </h3>

            <Lineclamp
              v-if="props.productDetails?.description"
              :class="styles.recommendation.content.details.description"
              :lines="2"
              :labelMore="t('product.actions.more', 1)"
              :labelLess="t('product.actions.more', 0)"
              >{{ props.productDetails.description }}</Lineclamp
            >

            <ul :class="styles.recommendation.content.list">
              <template
                v-for="benefit in props.productDetails?.benefits"
                :key="benefit.label"
              >
                <RecommendationBenefit v-if="benefit?.label" v-bind="benefit" />
              </template>
            </ul>
          </section>

          <!-- Price section -->
          <section :class="styles.recommendation.content.price.root">
            <!-- Price intro: eg. 'From' or 'Was $X.XX' -->
            <small :class="styles.recommendation.content.price.intro.root">
              <p :class="styles.recommendation.content.price.intro.text">
                <!-- If discounted, show regular price -->
                <template v-if="props.meta?.discounted">
                  <del>{{
                    t("recommendations.card.was_price", {
                      price: !!props.configuration.term
                        ? props.price.monthlyFromRegularPrice
                        : props.price.regularPrice
                    })
                  }}</del>
                </template>

                <!-- Otherwise, show 'Only' -->
                <template v-else>
                  <span>{{ t("recommendations.card.only") }}</span>
                </template>
              </p>

              <Promotion
                v-for="promotion in props.promotions"
                :key="promotion.code?.toString()"
                v-bind="promotion"
                size="sm"
              />
            </small>

            <div :class="styles.recommendation.content.price.current.root">
              <!-- Current Price -->
              <span :class="styles.recommendation.content.price.current.text">
                <template v-if="props.meta?.free">{{
                  t("recommendations.card.free")
                }}</template>
                <template v-else-if="!!props.configuration.term">{{
                  props.price.monthlyFromCurrentPrice
                }}</template>
                <template v-else>{{ props.price.currentPrice }}</template>
              </span>

              <!-- Term -->
              <template v-if="!!props.configuration.term">
                <span :class="styles.recommendation.content.price.term">{{
                  ` / ${t(`recommendations.terms.month`).toLocaleLowerCase()}`
                }}</span>
              </template>
            </div>

            <!-- Summary (If there is a billing cycle) -->
            <template v-if="!!props.configuration.term">
              <small :class="styles.recommendation.content.price.summary">
                {{
                  t(
                    props.meta?.discounted
                      ? "recommendations.card.discounted_summary"
                      : "recommendations.card.non_discounted_summary",
                    {
                      numericTerm: t(
                        `recommendations.terms.numeric.${props.configuration.term}`
                      ),
                      descriptiveTerm: t(
                        `recommendations.terms.descriptive.${props.configuration.term}`
                      ).toLocaleLowerCase(),
                      currentPrice: props.price.currentPrice,
                      regularPrice: props.price.regularPrice
                    }
                  )
                }}
              </small>
            </template>
          </section>
        </header>

        <!-- Button section -->
        <footer>
          <Button
            color="primary"
            :disabled="meta?.added"
            :loading="meta?.processing"
            :label="
              meta?.added
                ? t('recommendations.card.added')
                : props.productDetails?.label || t('recommendations.card.add')
            "
            block
            @click="doResolve(id)"
          >
            <template #prepend>
              <Icon v-if="meta?.added" icon="check" size="2xs" />
            </template>
          </Button>
        </footer>
      </div>
    </article>
  </Card>
</template>

<script lang="ts" setup>
// --- external
import { computed, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../recommendations.config";

// --- components
import { Button, Lineclamp, Icon, Badge } from "@upmind-automation/upmind-ui";
import Card from "../../../components/content/Card.vue";
import Promotion from "../../basket/product/components/Promotion.vue";
import RecommendationBenefit from "./Benefit.vue";

// --- types
import type { IconProps } from "@upmind-automation/upmind-ui";
import type { RecommendationItemProps } from "./types";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<RecommendationItemProps>();

const configMeta = computed(() => {
  const hasImage = !!props.productDetails?.imgUrl;
  const hasBadge = !!props.productDetails?.badge?.label;
  return {
    isDisabled: props.disabled,
    hasImage,
    hasBadge,
    hasImageAndBadge: hasImage && hasBadge
  };
});

const styles = useStyles(
  [
    "recommendation",
    "recommendation.image",
    "recommendation.content",
    "recommendation.content.price",
    "recommendation.content.price.intro",
    "recommendation.content.price.current",
    "recommendation.content.details",
    "recommendation.content.list"
  ],
  configMeta,
  config
) as ComputedRef<{
  recommendation: {
    root: string;
    container: string;
    image: {
      root: string;
      placeholder: string;
      image: string;
    };
    content: {
      root: string;
      breakdown: string;
      details: {
        root: string;
        title: string;
        description: string;
      };
      price: {
        root: string;
        intro: {
          root: string;
          text: string;
        };
        current: {
          root: string;
          text: string;
        };
        term: string;
        summary: string;
      };
      list: string;
    };
    badge: string;
  };
}>;

const emit = defineEmits<{
  (e: "resolve", value: string): void;
}>();

const doResolve = async (value: string) => {
  emit("resolve", value);
};
</script>
