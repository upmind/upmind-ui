<template>
  <!-- Mirrors BillingSummary: same Section + <dl> rows (company, phone,
       address), so the load state matches the summary it resolves into. -->
  <Section
    id="basket-billing"
    :label="t('text.billing_details')"
    icon="building-07"
    :card="card"
    :border="false"
  >
    <template #actions>
      <Skeleton :class="summarySkeletonActionVariants()" />
    </template>

    <component
      :is="card ? 'div' : CardRoot"
      :class="cardRootVariants({ card })"
    >
      <dl :class="summaryRootVariants()">
        <div :class="summaryRowVariants()">
          <dt :class="summaryLabelVariants()">
            <Skeleton :class="summarySkeletonCompanyLabelVariants()" />
          </dt>
          <dd :class="summaryValueVariants()">
            <Skeleton :class="summarySkeletonCompanyValueVariants()" />
          </dd>
        </div>

        <div :class="summaryRowVariants()">
          <dt :class="summaryLabelVariants()">
            <Skeleton :class="summarySkeletonPhoneLabelVariants()" />
          </dt>
          <dd :class="summaryValueVariants()">
            <Skeleton :class="summarySkeletonPhoneValueVariants()" />
          </dd>
        </div>

        <div :class="summaryRowVariants()">
          <dt :class="summaryLabelVariants()">
            <Skeleton :class="summarySkeletonAddressLabelVariants()" />
          </dt>
          <dd :class="summarySkeletonAddressVariants()">
            <Skeleton :class="summarySkeletonAddressLineVariants()" />
            <Skeleton :class="summarySkeletonAddressCityVariants()" />
          </dd>
        </div>
      </dl>
    </component>
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
// --- internal
// --- components
import { CardRoot, Skeleton } from "@upmind/ui";
import Section from "../../../components/section/Section.vue";
import {
  cardRootVariants,
  summaryLabelVariants,
  summaryRootVariants,
  summaryRowVariants,
  summarySkeletonActionVariants,
  summarySkeletonAddressCityVariants,
  summarySkeletonAddressLabelVariants,
  summarySkeletonAddressLineVariants,
  summarySkeletonAddressVariants,
  summarySkeletonCompanyLabelVariants,
  summarySkeletonCompanyValueVariants,
  summarySkeletonPhoneLabelVariants,
  summarySkeletonPhoneValueVariants,
  summaryValueVariants
} from "../variants";
// --- config
// --- types
import type { BillingSummarySkeletonProps } from "../types";

// -----------------------------------------------------------------------------

defineProps<BillingSummarySkeletonProps>();

const { t } = useI18n();
</script>
