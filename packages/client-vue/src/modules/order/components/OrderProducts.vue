<template>
  <Section
    id="order-products"
    :label="t('invoice.your_order')"
    icon="shopping-bag-02"
    card
    :border="false"
    :class="tableSectionVariants({ isInset: meta.isInset })"
  >
    <div :class="tableWrapperVariants()">
      <table :class="tableRootVariants()">
        <thead :class="tableHeaderRootVariants()">
          <tr>
            <th :class="tableHeaderCellVariants()">
              <span :class="tableHeaderLabelVariants()">
                {{ t("text.item") }}
                <Link
                  @click="toggleOpen"
                  color="muted"
                  :aria-label="t('invoice.product_information')"
                >
                  <Icon icon="info-circle" :class="tableHeaderIconVariants()" />
                </Link>
              </span>
            </th>
            <th :class="tableHeaderCellVariants()"></th>
            <th :class="tableHeaderCellVariants()">{{ t("text.qty") }}</th>
            <th :class="tableHeaderCellVariants()">{{ t("text.total") }}</th>
          </tr>
        </thead>

        <tbody :class="tableBodyVariants()">
          <OrderProductsRow
            v-for="(row, i) in displayRows"
            :key="i"
            :row="row"
            :expanded="open"
          />
        </tbody>

        <tfoot v-if="orderData">
          <tr
            v-if="orderData.summary?.discountAmount > 0"
            :class="tableFooterRowVariants()"
            data-muted
            v-bind="discountRowTestAttrs"
          >
            <td></td>
            <td :class="tableFooterCellVariants()">
              {{ t("text.discount") }}
            </td>
            <td></td>
            <td :class="tableFooterCellVariants()">
              {{ orderData.summary.discount }}
            </td>
          </tr>
          <tr :class="tableFooterRowVariants()" data-muted>
            <td></td>
            <td :class="tableFooterCellVariants()">
              {{ t("text.subtotal") }}
            </td>
            <td></td>
            <td :class="tableFooterCellVariants()">
              {{ orderData.summary?.subtotal }}
            </td>
          </tr>
          <tr
            v-for="tax in orderData.summary?.taxes"
            :key="tax.title"
            :class="tableFooterRowVariants()"
            data-muted
          >
            <td></td>
            <td :class="tableFooterCellVariants()">
              {{ tax.title }}
            </td>
            <td></td>
            <td :class="tableFooterCellVariants()">
              {{ tax.amount }}
            </td>
          </tr>
          <tr :class="tableFooterRowVariants()">
            <td></td>
            <td :class="tableFooterCellVariants()" data-emphasis="true">
              {{ t("text.total") }}
            </td>
            <td></td>
            <td :class="tableFooterCellVariants()" data-emphasis="true">
              {{ orderData.summary?.total }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <slot name="append" />
  </Section>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from "vue";
import { useI18n } from "vue-i18n";
import { parseBillingCycle } from "@upmind-automation/headless";
import { useTestAttrs } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import Section from "../../../components/section/Section.vue";
import { useSection } from "../../../components/section/useSection";
import {
  tableBodyVariants,
  tableFooterCellVariants,
  tableFooterRowVariants,
  tableHeaderCellVariants,
  tableHeaderIconVariants,
  tableHeaderLabelVariants,
  tableHeaderRootVariants,
  tableRootVariants,
  tableSectionVariants,
  tableWrapperVariants
} from "../variants";
import OrderProductsRow from "./OrderProductsRow.vue";
import { buildPricingRow, buildOptionRow, buildDetailRow } from "../utils";
import { flatMap, map, filter } from "lodash-es";
import type { TableRow } from "../types";
import type { Invoice } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const orderData = inject<ComputedRef<Invoice | undefined>>("orderInvoice");

const open = ref(false);

const displayRows = computed<TableRow[]>(() => {
  const visible = open.value
    ? rows.value
    : filter(rows.value, row => !row.meta.detail);

  return map(visible, (row, i) => {
    const next = visible[i + 1];
    return {
      ...row,
      meta: {
        ...row.meta,
        lastOfGroup: open.value && next?.meta.emphasis === true,
        lastBeforeOption:
          open.value && !!next?.meta.indented && !next?.meta.detail
      }
    };
  });
});

const rows = computed<TableRow[]>(() => {
  const products = orderData?.value?.products ?? [];

  return flatMap(products, product => {
    const [main, ...pricingOptions] = product.pricing;
    const pricingOptionIds = new Set(map(pricingOptions, p => p.id));

    const details = filter(
      product.details,
      d =>
        !d.name.startsWith("provision_field") &&
        !(d.name === "option" && pricingOptionIds.has(d.id))
    );

    const terms = filter(details, d => d.name === "term");
    const others = filter(details, d => d.name !== "term");

    return [
      buildPricingRow(main),
      ...map(terms, d => ({
        item: t("text.term_duration", {
          duration: parseBillingCycle(d.cycle ?? 0).numeric
        }),
        meta: { detail: true, term: true }
      })),
      ...map(others, buildDetailRow),
      ...map(pricingOptions, buildOptionRow)
    ];
  });
});

function toggleOpen() {
  open.value = !open.value;
}

const discountRowTestAttrs = useTestAttrs({ key: "discount-line-item" });

const { inset } = useSection();

const meta = computed(() => ({ isInset: inset.value }));
</script>
