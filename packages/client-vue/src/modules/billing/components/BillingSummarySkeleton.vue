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
      <Skeleton :class="styles.billing.summary.skeleton.action" />
    </template>

    <component :is="card ? 'div' : Card" :class="styles.billing.card.root">
      <dl :class="styles.billing.summary.root">
        <div :class="styles.billing.summary.row">
          <dt :class="styles.billing.summary.label">
            <Skeleton :class="styles.billing.summary.skeleton.companyLabel" />
          </dt>
          <dd :class="styles.billing.summary.value">
            <Skeleton :class="styles.billing.summary.skeleton.companyValue" />
          </dd>
        </div>

        <div :class="styles.billing.summary.row">
          <dt :class="styles.billing.summary.label">
            <Skeleton :class="styles.billing.summary.skeleton.phoneLabel" />
          </dt>
          <dd :class="styles.billing.summary.value">
            <Skeleton :class="styles.billing.summary.skeleton.phoneValue" />
          </dd>
        </div>

        <div :class="styles.billing.summary.row">
          <dt :class="styles.billing.summary.label">
            <Skeleton :class="styles.billing.summary.skeleton.addressLabel" />
          </dt>
          <dd :class="styles.billing.summary.skeleton.address">
            <Skeleton :class="styles.billing.summary.skeleton.addressLine" />
            <Skeleton :class="styles.billing.summary.skeleton.addressCity" />
          </dd>
        </div>
      </dl>
    </component>
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { Card, Skeleton } from "@upmind-automation/upmind-ui";
import Section from "../../../components/section/Section.vue";

// --- config
import config from "../billing.config";

// --- types
import type { BillingSummarySkeletonProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<BillingSummarySkeletonProps>();

const { t } = useI18n();
const styles = useStyles(
  ["billing.card", "billing.summary", "billing.summary.skeleton"],
  computed(() => ({ card: props.card })),
  config
);
</script>
