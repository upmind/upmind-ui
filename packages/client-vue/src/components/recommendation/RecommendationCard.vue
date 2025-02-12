<template>
  <Card :class="styles.recommendation.root" :disabled="configMeta?.isDisabled">
    <Badge
      v-if="badge?.label"
      v-bind="badge"
      variant="flat"
      size="lg"
      :class="styles.recommendation.badge"
    />

    <article :class="styles.recommendation.container">
      <!-- Image section -->
      <figure :class="styles.recommendation.image.root">
        <img
          v-if="imgUrl"
          :class="styles.recommendation.image.image"
          :src="imgUrl"
          :alt="`${name} item image`"
        />
        <span v-else :class="styles.recommendation.image.placeholder" />
      </figure>

      <!-- Content -->
      <div :class="styles.recommendation.content.root">
        <header :class="styles.recommendation.content.breakdown">
          <!-- Title and description -->
          <section :class="styles.recommendation.content.details.root">
            <h3 :class="styles.recommendation.content.details.title">
              {{ name }}
            </h3>

            <Lineclamp
              v-if="description"
              :class="styles.recommendation.content.details.description"
              :lines="2"
              :labelMore="t('product.actions.more', 1)"
              :labelLess="t('product.actions.more', 0)"
              >{{ description }}</Lineclamp
            >

            <ul :class="styles.recommendation.content.list">
              <template v-for="benefit in benefits" :key="benefit.label">
                <RecommendationBenefit
                  v-if="benefit?.label"
                  :label="benefit.label"
                  :icon="benefit.icon as IconProps"
                />
              </template>
            </ul>
          </section>

          <!-- Price section -->
          <section :class="styles.recommendation.content.price.root">
            <!-- Price intro: eg. 'From' or 'Was $X.XX' -->
            <small :class="styles.recommendation.content.price.intro.root">
              <p :class="styles.recommendation.content.price.intro.text">
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
            </small>

            <div :class="styles.recommendation.content.price.current.root">
              <!-- Current Price -->
              <span :class="styles.recommendation.content.price.current.text">
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
                <span :class="styles.recommendation.content.price.term">{{
                  ` / ${t(`recommendations.terms.month`).toLocaleLowerCase()}`
                }}</span>
              </template>
            </div>

            <!-- Summary (If there is a billing cycle) -->
            <template v-if="!!cycle">
              <small :class="styles.recommendation.content.price.summary">
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
                : label || t('recommendations.card.add')
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
import config from "./recommendation.config";

// --- components
import { Button, Lineclamp, Icon, Badge } from "@upmind-automation/upmind-ui";
import Card from "../content/Card.vue";
import Promotion from "../basket/product/components/Promotion.vue";
import RecommendationBenefit from "./components/Benefit.vue";

// --- types
import type { IconProps } from "@upmind-automation/upmind-ui";
import type { RecommendationItemProps } from "./types";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<RecommendationItemProps>();

const configMeta = computed(() => ({
  isDisabled: props.disabled,
}));

const styles = useStyles(
  [
    "recommendation",
    "recommendation.image",
    "recommendation.content",
    "recommendation.content.price",
    "recommendation.content.price.intro",
    "recommendation.content.price.current",
    "recommendation.content.details",
    "recommendation.content.list",
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
