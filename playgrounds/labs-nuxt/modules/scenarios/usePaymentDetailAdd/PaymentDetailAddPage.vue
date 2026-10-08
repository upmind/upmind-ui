<template>
  <Page :data-attrs="{ 'data-test-key': 'payment-detail-add-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.payment_detail_add_title") }}</PageTitle>
      <PageDescription>
        {{ t("labs.payment_detail_add_description") }}
      </PageDescription>
    </PageHeader>

    <PageBody class="gap-10">
      <Alert
        v-if="submitted && meta.hasErrors"
        variant="danger"
        appearance="outline"
        :title="t('error.payment_detail_add_failed')"
        :description="errors?.message"
        :data-attrs="{ 'data-test-key': 'payment-detail-add-error' }"
      />

      <UpmPaymentDetails v-if="!meta.isComplete" @resolve="onComplete" />

      <Interstitial
        v-else
        :close-label="t('action.close')"
        :title="t('labs.payment_detail_add_done')"
        :text="t('labs.payment_detail_add_done_text')"
        :animated-icon="{ icon: 'card', size: 'xl' }"
        :data-attrs="{ 'data-test-key': 'payment-detail-add-done' }"
      >
        <template #actions>
          <Button @click="addAnother">
            {{ t("labs.payment_detail_add_another") }}
          </Button>
        </template>
      </Interstitial>

      <Section
        id="stored-payment-methods"
        value="stored-payment-methods"
        icon="wallet-01"
        :label="t('labs.payment_detail_add_stored')"
      >
        <template #actions>
          <Badge size="sm" appearance="muted">{{ storedRows.length }}</Badge>
        </template>

        <Card size="sm">
          <EmptyState
            v-if="!storedRows.length"
            :title="t('labs.payment_detail_add_stored_empty')"
            :description="t('labs.payment_detail_add_stored_empty_text')"
          >
            <template #icon><Icon icon="credit-card-01" /></template>
          </EmptyState>

          <List v-else :items="storedRows">
            <template #trailing="{ row }">
              <StatusBadge v-if="row.isDefault" tone="success" size="sm">
                {{ t("text.default_label") }}
              </StatusBadge>
              <Badge v-if="row.currency" size="sm" appearance="muted">
                {{ row.currency }}
              </Badge>
            </template>
          </List>
        </Card>
      </Section>
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/usePaymentDetailAdd/PaymentDetailAddPage
 * @description Stores a payment method with no basket, invoice or order behind
 * it — the payment-detail machine's ADD context. `UpmPaymentDetails` takes the
 * composable by PROVIDE, which is what lets one component serve PAY and ADD.
 */

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Interstitial,
  List,
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle,
  StatusBadge
} from "@upmind/ui";
import { computed, provide, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Icon, Section } from "@upmind-automation/foundation";
import {
  useActiveSession,
  useBasketCurrency,
  usePaymentDetailAdd,
  usePaymentDetails
} from "@upmind-automation/headless";
import { UpmPaymentDetails } from "@upmind-automation/payment";
import { compact, join, map } from "lodash-es";
import type { ListRow } from "@upmind/ui";
import type { UsePaymentDetailAdd } from "@upmind-automation/headless";
import type { ICurrency } from "@upmind-automation/types";

/** A stored method as the roster draws it — a List row plus the two chips. */
type StoredRow = ListRow & { currency?: string; isDefault?: boolean };

const ADD_ANOTHER_PARAM = "again";

// NO `name`, `path` or `nav` here: the registrar owns all three, off the
// declaration beside this file. `key` stays — see ADD_ANOTHER_PARAM.
definePageMeta({
  key: route => route.fullPath
});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

await useActiveSession().useActions().isReady();

const { currency, isReady: currencyIsReady } = useBasketCurrency();
await currencyIsReady();

const instance = usePaymentDetailAdd({
  currency: currency.value as ICurrency
});

provide("usePaymentDetail", instance as UsePaymentDetailAdd);

const { errors, meta } = instance;
const { data: storedPaymentMethods, refresh } = usePaymentDetails();

const submitted = ref(false);

const storedRows = computed((): StoredRow[] =>
  map(storedPaymentMethods.value, method => ({
    value: method.id,
    title: method.name || method.title || undefined,
    description: join(
      compact([
        method.cardLast4 && method.cardType
          ? t("text.card_ending", {
              card_type: method.cardType,
              last4: method.cardLast4
            })
          : method.cardType,
        method.cardExpireDate &&
          `${t("text.expires_abbr")} ${method.cardExpireDate}`
      ]),
      " · "
    ),
    currency: method.currency?.code,
    isDefault: method.meta?.isDefault
  }))
);

async function onComplete() {
  submitted.value = true;
  await instance.add().catch(() => undefined);
  await refresh();
}

/** Remount with a fresh machine — see ADD_ANOTHER_PARAM. */
function addAnother() {
  router.replace({
    query: { ...route.query, [ADD_ANOTHER_PARAM]: Date.now().toString() }
  });
}

watch(currency, next => {
  if (next) instance.refresh(next as ICurrency);
});
</script>
