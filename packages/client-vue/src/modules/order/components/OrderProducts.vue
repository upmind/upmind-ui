<template>
  <Section
    id="order-products"
    :label="t('invoice.your_order')"
    icon="shopping-bag-02"
    :card="false"
    :border="false"
  >
    <Card :class="styles.table.wrapper">
      <table :class="styles.table.root">
        <thead :class="styles.table.header.root">
          <tr>
            <th :class="styles.table.header.cell">
              <span :class="styles.table.header.label">
                {{ t("text.item") }}
                <Link
                  @click="toggleOpen"
                  color="muted"
                  :aria-label="t('invoice.product_information')"
                >
                  <Icon icon="info-circle" :class="styles.table.header.icon" />
                </Link>
              </span>
            </th>
            <th :class="styles.table.header.cell"></th>
            <th :class="styles.table.header.cell">{{ t("text.qty") }}</th>
            <th :class="styles.table.header.cell">{{ t("text.total") }}</th>
          </tr>
        </thead>

        <tbody :class="styles.table.body">
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
            :class="styles.table.footer.row"
            data-muted
          >
            <td></td>
            <td :class="styles.table.footer.cell">
              {{ t("text.discount") }}
            </td>
            <td></td>
            <td :class="styles.table.footer.cell">
              {{ orderData.summary.discount }}
            </td>
          </tr>
          <tr :class="styles.table.footer.row" data-muted>
            <td></td>
            <td :class="styles.table.footer.cell">
              {{ t("text.subtotal") }}
            </td>
            <td></td>
            <td :class="styles.table.footer.cell">
              {{ orderData.summary?.subtotal }}
            </td>
          </tr>
          <tr
            v-for="tax in orderData.summary?.taxes"
            :key="tax.title"
            :class="styles.table.footer.row"
            data-muted
          >
            <td></td>
            <td :class="styles.table.footer.cell">
              {{ tax.title }}
            </td>
            <td></td>
            <td :class="styles.table.footer.cell">
              {{ tax.amount }}
            </td>
          </tr>
          <tr :class="styles.table.footer.row">
            <td></td>
            <td :class="styles.table.footer.cell" data-emphasis="true">
              {{ t("text.total") }}
            </td>
            <td></td>
            <td :class="styles.table.footer.cell" data-emphasis="true">
              {{ orderData.summary?.total }}
            </td>
          </tr>
        </tfoot>
      </table>
    </Card>

    <slot name="append" />
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { computed, inject, ref } from "vue";
import { useI18n } from "vue-i18n";
import { flatMap, map, filter } from "lodash-es";

// --- internal
import Section from "../../../components/section/Section.vue";
import OrderProductsRow from "./OrderProductsRow.vue";
import config from "../order.config";
import { useStyles, Link, Icon, Card } from "@upmind-automation/upmind-ui";
import { parseBillingCycle } from "@upmind-automation/headless";
import { buildPricingRow, buildOptionRow, buildDetailRow } from "../utils";

// --- types
import type { ComputedRef } from "vue";
import type { Invoice } from "@upmind-automation/headless";
import type { TableRow } from "../types";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const orderData = inject<ComputedRef<Invoice | undefined>>("orderInvoice");

const open = ref(false);

const styles = useStyles(
  ["table", "table.wrapper", "table.header", "table.footer"],
  computed(() => ({})),
  config,
  {}
);

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
</script>
