<template>
  <Layout>
    <template #content-header>
      <Categories
        v-model="categoryId"
        :sort="params.sort"
        :direction="params.direction"
        :description="description"
        :is-faceted="isFaceted"
        v-bind="category"
        :name="name"
        :category-route="props.categoryRoute"
      >
        <template #prepend>
          <Breadcrumbs
            v-model="categoryId"
            :sort="params.sort"
            :direction="params.direction"
            :name="name"
            :category-route="props.categoryRoute"
          />
        </template>
      </Categories>
    </template>

    <template #content>
      <div :class="styles.products.root" v-auto-animate>
        <aside :class="styles.products.facets.root" v-if="isFaceted">
          <CategoriesFacet
            v-model="categoryId"
            :sort="params.sort"
            :direction="params.direction"
            :category-route="props.categoryRoute"
            :name="name"
          />
        </aside>

        <component
          :is="widget"
          v-model:categoryId="categoryId"
          v-model:sort="params.sort"
          v-model:direction="params.direction"
          v-model:query="params.query"
          :configure-route="props.configureRoute"
        />
      </div>
    </template>

    <template v-if="widget === WidgetDAC" #content-footer>
      <div id="catalogue-content-footer" class="w-full lg:w-auto" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
// --- external
import { computed, provide } from "vue";
import { useRouteQuery } from "@vueuse/router";
import { useUrlSearchParams } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useProductCategories,
  useBrand,
  ProductSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
import config from "./catalogue.config";
import { useLayout } from "../../components/layout/useLayout";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";

// --- components
import { useStyles } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import Breadcrumbs from "./categories/Breadcrumbs.vue";
import Share from "../../components/navigation/Share.vue";
import CategoriesFacet from "./categories/facet/CategoriesFacet.vue";
import Categories from "./categories/Categories.vue";
import WidgetGrid from "./products/WidgetGrid.vue";
import WidgetDAC from "./products/WidgetDAC.vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ProductCategory } from "@upmind-automation/headless";
import type { LAYOUT_VARIANTS } from "@/components/layout";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<{
  layout?: LAYOUT_VARIANTS;
  categoryRoute: RouteLocationAsRelativeGeneric;
  configureRoute?: RouteLocationAsRelativeGeneric;
}>();

// -----------------------------------------------------------------------------
const { uiCart, name } = useBrand();
const instance = useProductCategories();
provide("useProductCategories", instance);

const { t } = useI18n();

// --- state

const categoryId = useRouteQuery<string | undefined>("catid", undefined, {
  mode: "push"
});

// TODO: Reset the layout until we implement the templates for catalogue
useLayout({});
useHeader({});
useFooter({});

const params = useUrlSearchParams<{
  sort?: ProductSortableProperties;
  direction?: RequestSortDirection;
  query?: string;
}>("history", {
  removeNullishValues: true,
  removeFalsyValues: true
});

// --- category logic moved from Categories
const category = computed((): ProductCategory => {
  const category = categoryId.value
    ? instance.getOne(categoryId.value)
    : undefined;
  return category || { id: "", name: "", title: t("text.categories") };
});

const description = computed(() => {
  return (
    category.value.description ||
    (isEmpty(categoryId.value) && uiCart.value?.description) ||
    ""
  );
});

// --- context

const widget = computed(() => {
  //  if we have a category, we need to check its uiMeta to determine the widget to use
  if (categoryId.value) {
    const category = instance.findOne({ id: categoryId.value });
    if (category?.uiMeta?.widgets?.dac) return WidgetDAC;
  }

  // our default widget
  return WidgetGrid;
});

const styles = useStyles(
  ["products", "products.facets"],
  {},
  config
) as ComputedRef<{
  products: {
    root: string;
    facets: {
      root: string;
    };
  };
}>;

const isFaceted = computed(() => {
  return !!uiCart.value?.catalogue?.facet;
});
</script>
