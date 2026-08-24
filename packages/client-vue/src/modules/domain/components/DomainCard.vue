<template>
  <article
    :class="cardRootVariants({ isExactMatch: meta.isExactMatch })"
    :data-exact-match="meta.isExactMatch"
  >
    <header :class="cardHeaderRootVariants()">
      <!-- TODO: Add favourite action -->

      <div :class="cardHeaderDetailsRootVariants()">
        <section :class="cardHeaderDetailsStatusRootVariants()">
          <Skeleton
            v-if="meta.isPriceLoading"
            :class="cardSkeletonStatusVariants()"
            data-test-key="dac-card-status-loading"
          />
          <small
            v-else
            :class="cardHeaderDetailsStatusLabelVariants()"
            role="status"
            aria-label="Domain availability status"
          >
            {{ getStatus }}
          </small>

          <Badge
            v-if="meta.isExactMatch && isMobile"
            appearance="outline"
            variant="neutral"
            size="sm"
          >
            {{ t("text.exact_match") }}
          </Badge>
        </section>

        <section :class="cardHeaderDetailsTitleRootVariants()">
          <h3
            :class="
              cardHeaderDetailsTitleFldVariants({
                isExactMatch: meta.isExactMatch
              })
            "
            data-test-key="domain-card-name"
            :data-test-value="props.domain"
          >
            <span :class="cardHeaderDetailsTitleSldVariants()">
              {{ props.sld }}
            </span>
            <span :class="cardHeaderDetailsTitleTldVariants()">
              {{ props.tld }}
            </span>
          </h3>

          <Badge
            v-if="meta.isExactMatch && !isMobile"
            appearance="outline"
            variant="neutral"
            size="md"
          >
            {{ t("text.exact_match") }}
          </Badge>
        </section>

        <section
          :class="cardHeaderDetailsPricingVariants()"
          aria-label="Pricing information"
        >
          <Skeleton
            v-if="meta.isPriceLoading"
            :class="cardSkeletonDescriptionVariants()"
            data-test-key="dac-card-description-loading"
          />
          <DomainDescription
            v-else
            :price="props.price"
            :meta="meta"
            :cycle="props.cycle"
          />
        </section>
      </div>
    </header>

    <footer :class="cardFooterRootVariants()">
      <template v-if="meta.isPriceLoading">
        <section :class="cardFooterPriceRootVariants()">
          <Skeleton
            :class="cardSkeletonPriceVariants()"
            data-test-key="dac-card-price-loading"
          />
        </section>
      </template>
      <template v-else-if="meta.isUnavailable">
        <!-- No extra text for unavailable state -->
      </template>
      <template v-else-if="meta.isAvailable">
        <div v-if="!isMobile">
          <Badge
            v-if="props.price.savingPercent"
            appearance="muted"
            variant="promo"
            :size="meta.isExactMatch ? 'md' : 'sm'"
          >
            {{ t("action.save_value", { value: props.price.savingPercent }) }}
          </Badge>
        </div>

        <section :class="cardFooterPriceRootVariants()">
          <CurrentPrice
            is="h3"
            :class="cardFooterPriceAmountVariants()"
            :current-price="props.price.currentPrice"
            :dataAttrs="{
              'data-test-key': 'domain-card-price',
              'data-test-value': props.price.currentPrice
            }"
          />

          <small v-if="!props.free" :class="cardFooterPriceTermVariants()"
            >/ {{ parseBillingCycle(props.cycle!).suffix }}</small
          >

          <div class="ml-auto" v-if="isMobile && props.price.savingPercent">
            <Badge
              appearance="muted"
              variant="promo"
              :size="meta.isExactMatch ? 'md' : 'sm'"
            >
              {{ t("action.save_value", { value: props.price.savingPercent }) }}
            </Badge>
          </div>
        </section>
      </template>
      <template v-else>
        <div v-if="!isMobile">
          <Badge
            v-if="props.price.savingPercent"
            appearance="muted"
            variant="promo"
            :size="meta.isExactMatch ? 'md' : 'sm'"
          >
            {{ t("action.save_value", { value: props.price.savingPercent }) }}
          </Badge>
        </div>

        <p
          class="text-muted mt-1 text-sm md:mt-0 md:text-right"
          data-test-key="domain-transfer-pricing-info"
          :data-test-value="meta.isTransferFree ? 'free' : 'paid'"
        >
          {{ $t("domain.transfer_owner_question")
          }}<br class="hidden md:block" />
          {{
            // Two variants:
            //   - `transfer_free_info`  — brand-override transfer price is 0
            //   - `transfer_today_info` — everything else (no override, or
            //                              override > 0)
            // Driven off `meta.isTransferFree` (boolean from the helper)
            // rather than string-matching the formatted "FREE" label, so
            // any locale's free translation works without code changes.
            meta.isTransferFree
              ? $t("domain.transfer_free_info")
              : $t("domain.transfer_today_info")
          }}<br class="hidden md:block" />
          {{
            $t("domain.tld_renewal_info", {
              regularPrice: props.price.regularPrice,
              term: parseBillingCycle(props.cycle ?? 0).suffix
            })
          }}
        </p>

        <div class="ml-auto" v-if="isMobile && props.price.savingPercent">
          <Badge
            appearance="muted"
            variant="promo"
            :size="meta.isExactMatch ? 'md' : 'sm'"
          >
            {{ t("action.save_value", { value: props.price.savingPercent }) }}
          </Badge>
        </div>
      </template>

      <Skeleton
        v-if="meta.isPriceLoading"
        :class="[
          cardFooterButtonRootVariants(),
          cardSkeletonPriceButtonVariants()
        ]"
        v-bind="buttonLoadingTestAttrs"
      />

      <Tooltip v-else :active="!meta.isExactMatch && !isMobile">
        <Button
          :loading="meta.isProcessing"
          :class="cardFooterButtonRootVariants()"
          size="lg"
          :variant="meta.isAdded ? 'secondary' : 'outline'"
          :disabled="meta.isProcessing || meta.isDisabled"
          @click="
            meta.isAdded ? onRemove(props.domain) : onUpdate(props.domain)
          "
          :data-attrs="{ 'data-test-key': 'domain-card-cta' }"
          :data-test-value="ctaState"
        >
          <Icon v-if="getIcon" :icon="getIcon" />
          <span
            :class="
              cardFooterButtonLabelVariants({
                isExactMatch: meta.isExactMatch
              })
            "
            >{{ getLabel }}</span
          >
        </Button>
        <template #content>{{ getTooltip }}</template>
      </Tooltip>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { parseBillingCycle } from "@upmind-automation/headless";
import { useTestAttrs } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { Skeleton } from "@upmind/ui";
import { Badge, Tooltip } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import { isMobile } from "../../../composables/isMobile";
import CurrentPrice from "../../product/components/pricing/CurrentPrice.vue";
import {
  cardRootVariants,
  cardHeaderRootVariants,
  cardHeaderDetailsRootVariants,
  cardHeaderDetailsStatusRootVariants,
  cardHeaderDetailsStatusLabelVariants,
  cardHeaderDetailsTitleRootVariants,
  cardHeaderDetailsTitleFldVariants,
  cardHeaderDetailsTitleSldVariants,
  cardHeaderDetailsTitleTldVariants,
  cardHeaderDetailsPricingVariants,
  cardFooterRootVariants,
  cardFooterPriceRootVariants,
  cardFooterPriceAmountVariants,
  cardFooterPriceTermVariants,
  cardFooterButtonRootVariants,
  cardFooterButtonLabelVariants,
  cardSkeletonStatusVariants,
  cardSkeletonDescriptionVariants,
  cardSkeletonPriceVariants,
  cardSkeletonPriceButtonVariants
} from "../variants";
import DomainDescription from "./DomainDescription.vue";
import type { DomainCardProps } from "../types";

// -----------------------------------------------------------------------------
const emit = defineEmits<{
  (e: "add", domain: string): void;
  (e: "remove", domain: string): void;
}>();

const props = defineProps<DomainCardProps>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const meta = computed(() => ({
  isDisabled: !!props.disabled || !!props.unavailable,
  isProcessing: !!props.processing,
  isAvailable: !!props.available,
  isAdded: !!props.added,
  isExactMatch: !!props.exactMatch,
  isOwned: !!props.owned,
  isDiscounted: !!props.discounted,
  isUnavailable: !!props.unavailable,
  isTransferable: !!props.canTransfer,
  isPriceLoading: !!props.priceLoading,
  // Brand has supplied a custom label for the transfer button via
  // `meta.overrides.dac.i18n.transfer` — surface it as a disabled button
  // even when the row is otherwise "unavailable".
  hasTransferLabel: !!props.transferLabel,
  // `true` only when the transfer sub-product's `category.price_override`
  // is set AND its one-off price row is `0`. Drives the "transfer FREE"
  // vs "transfer today" copy below.
  isTransferFree: !!props.transferOptionIsFree
}));

const getStatus = computed(() => {
  if (meta.value.isUnavailable) {
    return t("text.unavailable");
  } else if (meta.value.isOwned) {
    return t("confirm.in_use");
  } else if (meta.value.isAdded) {
    return t("confirm.in_basket");
  } else if (meta.value.isAvailable) {
    return t("text.available");
  } else {
    return t("text.taken");
  }
});

const getIcon = computed(() => {
  if (meta.value.isUnavailable) {
    return "alert-circle";
  } else if (meta.value.isAdded) {
    return "check-circle-broken";
  } else if (meta.value.isAvailable) {
    return "shopping-bag-02";
  } else {
    return "switch-horizontal-02";
  }
});

const getLabel = computed(() => {
  // Brand-supplied override (e.g. ".com transfer = Unavailable") wins
  // over the default unavailable copy — but only when the row really IS
  // unavailable. The transferLabel is set per-TLD/category, so registrable
  // rows on the same TLD would otherwise inherit it and incorrectly say
  // "Unavailable" instead of "Add to basket".
  if (
    meta.value.hasTransferLabel &&
    meta.value.isUnavailable &&
    !meta.value.isAdded
  ) {
    return props.transferLabel!;
  }
  if (meta.value.isUnavailable) {
    return t("text.unavailable");
  } else if (meta.value.isAdded) {
    return t("confirm.in_basket");
  } else if (meta.value.isAvailable) {
    return t("action.add_to_basket");
  }
  return t("domain.transfer_domain");
});

const ctaState = computed(() => {
  if (meta.value.isAdded) return "added";
  if (meta.value.isUnavailable) return "unavailable";
  if (meta.value.isAvailable) return "register";
  return "transfer";
});

const getTooltip = computed(() => {
  if (
    meta.value.hasTransferLabel &&
    meta.value.isUnavailable &&
    !meta.value.isAdded
  ) {
    return props.transferLabel!;
  }
  if (meta.value.isUnavailable) {
    return t("text.unavailable");
  } else if (meta.value.isProcessing && !meta.value.isAdded) {
    return t("action.adding");
  } else if (meta.value.isProcessing && meta.value.isAdded) {
    return t("action.removing");
  } else if (meta.value.isAdded) {
    return t("confirm.in_basket");
  } else if (meta.value.isAvailable) {
    return t("action.add_to_basket");
  }
  return t("domain.transfer_domain");
});

function onUpdate(value: string): void {
  if (meta.value.isDisabled || meta.value.isProcessing) return;
  emit("add", value);
}

function onRemove(value: string): void {
  if (meta.value.isDisabled || meta.value.isProcessing) return;
  emit("remove", value);
}

const buttonLoadingTestAttrs = useTestAttrs({ key: "dac-card-button-loading" });
</script>
