<template>
  <template v-if="(!meta.isLoading && meta.hasProducts) || meta.isCheckout">
    <!-- breakdown: one block per product, a line per configuration detail,
         priced from the saved server basket. Taxes read as calculating while a
         refresh is in flight — the basket carries none until it returns. -->
    <div v-if="props.showBreakdown" :class="styles.summary.sections">
      <div :class="styles.summary.products">
        <div
          v-for="product in productSummaries"
          :key="product.id"
          :class="styles.summary.product.root"
        >
          <!-- header: title (+ ×N multiplier when buying more than one) and the
               all-units line total -->
          <div :class="styles.summary.product.header">
            <span :class="styles.summary.product.title">
              <Link
                v-if="product.route"
                :to="product.route"
                color="inherit"
                size="inherit"
                :label="product.title"
              />
              <template v-else>{{ product.title }}</template>
              <span
                v-if="product.meta.isMultiple"
                :class="styles.summary.product.multiplier"
              >
                ×{{ product.quantity }}
              </span>
            </span>
            <span :class="styles.summary.product.total">
              <Skeleton
                v-if="meta.isPricesCalculating"
                :class="styles.summary.skeleton"
              />
              <template v-else>{{ product.total }}</template>
            </span>
          </div>

          <!-- per-unit price sits under the title when buying more than one -->
          <p
            v-if="product.meta.isMultiple"
            :class="styles.summary.product.subtitle"
          >
            {{ t("text.per_unit", { price: product.unitPrice }) }}
          </p>

          <!-- configuration lines, enclosed. the "each unit includes" label and
               unit-price footer show only when buying more than one -->
          <div :class="styles.summary.product.box">
            <p
              v-if="product.meta.isMultiple"
              :class="styles.summary.product.boxLabel"
            >
              {{ t("text.each_unit_includes") }}
            </p>

            <div
              v-for="(line, index) in product.lines"
              :key="`${product.id}-${index}`"
              :class="styles.summary.line.root"
            >
              <span>
                <span :class="styles.summary.line.label"
                  >{{ line.label }}:</span
                >
                {{ line.value }}
                <!-- quantity sits with the item, not the price — the price is
                     the line total, so a multiplier beside it reads as a
                     re-multiply -->
                <span
                  v-if="(line.quantity ?? 0) > 1"
                  :class="styles.summary.line.quantity"
                >
                  ×{{ line.quantity
                  }}<template v-if="line.each">&nbsp;{{ line.each }}</template>
                </span>
              </span>
              <span :class="styles.summary.line.price">
                <Skeleton
                  v-if="meta.isPricesCalculating"
                  :class="styles.summary.skeleton"
                />
                <template v-else-if="line.price">{{ line.price }}</template>
                <template v-else>–</template>
              </span>
            </div>

            <div
              v-if="product.meta.isMultiple"
              :class="styles.summary.product.unitPrice"
            >
              <span>{{ t("text.unit_price") }}</span>
              <span :class="styles.summary.line.price">
                <Skeleton
                  v-if="meta.isPricesCalculating"
                  :class="styles.summary.skeleton"
                />
                <template v-else>{{ product.unitPrice }}</template>
              </span>
            </div>
          </div>
        </div>
      </div>

      <dl :class="styles.summary.adjustments">
        <div v-if="discount" :class="styles.summary.line.root">
          <dt :class="styles.summary.line.label">
            {{ t("text.discount", products?.length || 0) }}
          </dt>
          <dd :class="styles.summary.line.price">
            <Skeleton
              v-if="meta.isPricesCalculating"
              :class="styles.summary.skeleton"
            />
            <template v-else>{{ discount }}</template>
          </dd>
        </div>

        <div v-if="subtotal" :class="styles.summary.line.root">
          <dt :class="styles.summary.line.label">{{ t("text.subtotal") }}</dt>
          <dd :class="styles.summary.line.price">
            <Skeleton
              v-if="meta.isPricesCalculating"
              :class="styles.summary.skeleton"
            />
            <template v-else>{{ subtotal }}</template>
          </dd>
        </div>

        <template v-if="taxes.length">
          <div
            v-for="(tax, index) in taxes"
            :key="`tax-${index}`"
            :class="styles.summary.line.root"
          >
            <dt :class="styles.summary.line.label">{{ tax.title }}</dt>
            <dd :class="styles.summary.line.price">
              <Skeleton
                v-if="meta.isPricesCalculating"
                :class="styles.summary.skeleton"
              />
              <template v-else>{{ tax.amount }}</template>
            </dd>
          </div>
        </template>
        <div
          v-else-if="meta.isPricesUpdating"
          :class="styles.summary.line.root"
        >
          <dt :class="styles.summary.line.label">{{ t("text.taxes") }}:</dt>
          <dd :class="styles.summary.line.muted">
            {{ t("text.taxes_calculating") }}
          </dd>
        </div>
      </dl>

      <div
        v-if="props.showTotal"
        :class="cn(styles.summary.item.root, styles.summary.total)"
      >
        <dt :class="styles.summary.item.term">{{ t("text.total") }}</dt>
        <dd :class="styles.summary.item.description">
          <Skeleton
            v-if="meta.isPricesCalculating || !total"
            :class="styles.summary.item.skeleton"
          />
          <template v-else>{{ total }}</template>
        </dd>
      </div>

      <!-- trailing content (e.g. the promotions form) sits inside the summary's
           own sections so it shares their spacing -->
      <slot />
    </div>

    <!-- plain totals -->
    <div v-else :class="styles.summary.root">
      <DescriptionList v-if="!isEmpty(productItems)" :items="productItems">
        <template #description="{ item }">
          <Skeleton
            v-if="meta.isPricesCalculating"
            :class="styles.summary.skeleton"
          />
          <template v-else>{{ item.description }}</template>
        </template>
      </DescriptionList>

      <DescriptionList v-if="!isEmpty(subtotalItems)" :items="subtotalItems">
        <template #description="{ item }">
          <Skeleton
            v-if="meta.isPricesCalculating"
            :class="styles.summary.skeleton"
          />
          <template v-else>{{ item.description }}</template>
        </template>
        <BasketTotal class="mt-2" v-if="props.showTotal" />
      </DescriptionList>

      <BasketPromotions v-if="props.showPromotions" />
    </div>
  </template>

  <template v-else>
    <SummarySkeleton
      :show-breakdown="props.showBreakdown"
      :show-button="props.showButton"
      :card="card"
    />
  </template>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  concat,
  filter,
  forEach,
  includes,
  isEmpty,
  map,
  merge,
  reject,
  some
} from "lodash-es";

// --- components
import {
  DescriptionList,
  Link,
  Skeleton,
  type DescriptionItem
} from "@upmind-automation/upmind-ui";
import BasketPromotions from "./Promotions.vue";
import SummarySkeleton from "./SummarySkeleton.vue";
import BasketTotal from "./BasketTotal.vue";

// --- internal
import {
  parseBillingCycle,
  useBasket,
  useConfig,
  useMoney
} from "@upmind-automation/headless";
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import { useSection } from "../../../components/section/useSection";
import config from "./summary.config";

// --- types
import type { Product } from "@upmind-automation/headless";
import type { SummaryProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SummaryProps>(), {
  showBreakdown: false,
  showProducts: false,
  showPromotions: true,
  showTotal: true,
  showButton: true
});

const { t } = useI18n();
const { meta, products, summary } = useBasket();
const { ui, data } = useConfig();
const { formatPrice } = useMoney();
const { card } = useSection();

const styles = useStyles(
  ["summary", "summary.item", "summary.line", "summary.product"],
  computed(() => ({ card: card.value })),
  config
);

// --- plain totals

const productItems = computed((): DescriptionItem[] => {
  let items = [] as DescriptionItem[];

  if (!isEmpty(summary.value?.products) && props.showProducts) {
    const productItems =
      map(summary.value!.products, (product: any) => {
        const { data } = useConfig({
          product
        });

        return {
          term: data.productName || product?.productDetails?.title || "",
          description:
            formatPrice(product?.price?.basePrice, {
              trimTrailingZeroes: data.trimTrailingZeroes
            }) || ""
        };
      }) ?? [];

    items = concat(productItems, items);
  }

  return items;
});

const subtotalItems = computed(() => {
  const items = [] as DescriptionItem[];

  if (!isEmpty(summary.value?.discount)) {
    items.push({
      term: t("text.discount", products?.value?.length || 0),
      description:
        formatPrice(summary?.value?.discount, {
          trimTrailingZeroes: data.trimTrailingZeroes
        }) || ""
    });
  }

  if (!isEmpty(summary.value?.subtotal)) {
    items.push({
      term: t("text.subtotal", products?.value?.length || 0),
      description:
        formatPrice(summary?.value?.subtotal, {
          trimTrailingZeroes: data.trimTrailingZeroes
        }) || ""
    });
  }

  if (!isEmpty(summary.value?.taxes)) {
    forEach(summary.value!.taxes, tax => {
      items.push({
        term: tax?.title || "",
        description:
          formatPrice(tax?.amount, {
            trimTrailingZeroes: data.trimTrailingZeroes
          }) || ""
      });
    });
  }

  return items;
});

// --- breakdown

// the configuration details worth a summary line
const SUMMARY_DETAILS = ["term", "option", "attribute"];

// server-formatted price → display value (zero-as-label + trailing zeroes)
function displayPrice(amount?: string | null): string {
  return (
    formatPrice(amount, {
      zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
      trimTrailingZeroes: data.trimTrailingZeroes
    }) ?? ""
  );
}

// one config line's PER-UNIT price, so the enclosed lines reconcile with the
// unit price. A term prices the product on its own — its configured price
// already includes the options, which follow as their own lines — while an
// option prices its as-configured selection; falls back to the aggregate for
// details without a served per-unit figure
function linePrice(detail: Product["details"][number]): string {
  if (!("price" in detail)) return "";
  if (detail.name === "term") return displayPrice(detail.price.unitPrice);
  const amount =
    detail.price.configurationUnitPrice ??
    detail.price.regularPrice ??
    detail.price.configuration?.totalFormatted ??
    detail.price.currentPrice;
  return displayPrice(amount);
}

// the per-single price beside a multi-quantity line (e.g. "@ £250.00"); absent
// unless the line carries a served unit price
function lineEach(detail: Product["details"][number]): string | undefined {
  if (!("price" in detail)) return undefined;
  const price = displayPrice(detail.price.unit?.totalFormatted);
  if (!price) return undefined;
  return t("text.price_each", { price });
}

// one config line: term shows its billing cycle; options/attributes their title
// and per-unit quantity. All priced per unit via linePrice.
function summaryLine(detail: Product["details"][number]) {
  if (detail.name === "term") {
    return {
      label: t("text.billing_cycle"),
      value: parseBillingCycle(detail.cycle ?? 0).adverbial,
      quantity: undefined,
      each: undefined,
      price: linePrice(detail)
    };
  }
  return {
    label: detail.category ?? "",
    value: detail.title ?? "",
    // per-unit count: the product line renders its own multiplier, so a total
    // here would compound it. Attribute rows carry no unit quantity.
    quantity: detail.unitQuantity ?? detail.quantity,
    each: lineEach(detail),
    price: linePrice(detail)
  };
}

// tag the route with the product so the destination can focus it — the basket
// step scrolls to the matching card on arrival
function productRoute(product: Product) {
  if (!props.editRoute || !product.id) return undefined;
  return merge({}, props.editRoute, { query: { product: product.id } });
}

// one block per product: its name, then a line per configuration detail
const productSummaries = computed(() =>
  map(products.value ?? [], (product: Product) => {
    const worthShowing = filter(product.details, detail =>
      includes(SUMMARY_DETAILS, detail.name)
    );
    // a price-overriding selection replaces the product's own term price, so the
    // term line would not add up to the total — hide it
    const hasPriceOverride = some(
      worthShowing,
      detail => detail.name !== "term" && !!detail.meta?.overrides
    );
    const details = reject(
      worthShowing,
      detail => hasPriceOverride && detail.name === "term"
    );

    const quantity = product.configuration?.quantity ?? 0;

    return {
      id: product.id,
      title: product.productDetails?.title ?? "",
      quantity,
      route: productRoute(product),
      lines: map(details, summaryLine),
      // header shows the all-units aggregate; subtitle/footer the one-unit price
      total: displayPrice(product.price?.regularPrice),
      unitPrice: displayPrice(product.price?.configurationUnitPrice),
      meta: {
        // single gate for the quantity>1 affordances: ×N multiplier, per-unit
        // subtitle, "each unit includes" label, and unit-price footer
        isMultiple: quantity > 1
      }
    };
  })
);

const discount = computed(
  () =>
    formatPrice(summary.value?.discount, {
      trimTrailingZeroes: data.trimTrailingZeroes
    }) ?? ""
);

const subtotal = computed(
  () =>
    formatPrice(summary.value?.subtotal, {
      trimTrailingZeroes: data.trimTrailingZeroes
    }) ?? ""
);

const taxes = computed(() =>
  map(summary.value?.taxes ?? [], tax => ({
    title: tax.title,
    amount:
      formatPrice(tax.amount, {
        trimTrailingZeroes: data.trimTrailingZeroes
      }) ?? ""
  }))
);

const total = computed(
  () =>
    formatPrice(summary.value?.total, {
      zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
      trimTrailingZeroes: data.trimTrailingZeroes
    }) ?? ""
);
</script>
