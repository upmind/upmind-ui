<template>
  <Layout>
    <template #content-header>
      <Categories
        v-model="categoryId"
        v-bind="{ ...category, title }"
        :description="description"
        :badge="badge"
        :sort="params.sort"
        :direction="params.direction"
        :is-faceted="isFaceted"
        :category-route="props.categoryRoute"
      >
        <template v-if="categoryId" #prepend>
          <Breadcrumbs
            v-model="categoryId"
            :sort="params.sort"
            :direction="params.direction"
            :name="title"
            :category-route="props.categoryRoute"
          />
        </template>
      </Categories>
    </template>

    <template #content>
      <div :class="productsRootVariants()" v-auto-animate>
        <aside :class="productsFacetsRootVariants()" v-if="isFaceted">
          <CategoriesFacet
            v-model="categoryId"
            :sort="params.sort"
            :direction="params.direction"
            :category-route="props.categoryRoute"
            :name="title"
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

    <template v-if="widget === WidgetDAC" #aside-footer>
      <div id="domain-aside-footer" class="w-full lg:w-auto" />
    </template>

    <template v-if="widget === WidgetDAC" #content-footer>
      <div id="domain-content-footer" class="w-full lg:w-auto" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import { vAutoAnimate } from "@formkit/auto-animate";
import { useUrlSearchParams } from "@vueuse/core";
import { useRouteQuery } from "@vueuse/router";
import { computed, onMounted, provide } from "vue";
import { useI18n } from "vue-i18n";
import {
  useProductCategories,
  useBrand,
  UIContext
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import { PRODUCT_LIST_STYLE, LIST_STYLE } from "@upmind-automation/headless";
import { useFooter } from "../../components/footer/useFooter";
import { useHeader } from "../../components/header/useHeader";
import Layout from "../../components/layout/Layout.vue";
import { useLayout } from "../../components/layout/useLayout";
import { useThemes } from "../theming";
import Breadcrumbs from "./categories/Breadcrumbs.vue";
import Categories from "./categories/Categories.vue";
import CategoriesFacet from "./categories/facet/CategoriesFacet.vue";
import WidgetDAC from "./products/WidgetDAC.vue";
import WidgetGrid from "./products/WidgetGrid.vue";
import { productsRootVariants, productsFacetsRootVariants } from "./variants";
import { last } from "lodash-es";
import type { LAYOUT_VARIANTS } from "../../components/layout";
import type {
  ProductCategory,
  ProductSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<{
  layout?: LAYOUT_VARIANTS;
  categoryRoute: RouteLocationAsRelativeGeneric;
  configureRoute?: RouteLocationAsRelativeGeneric;
}>();

// -----------------------------------------------------------------------------
const { uiCart: _uiCart } = useBrand();
const instance = useProductCategories();
provide("useProductCategories", instance);

const { t: _t } = useI18n();
const { set } = useThemes();

const categoryId = useRouteQuery<string | undefined>("catid", undefined, {
  mode: "push"
});

const { ui, data } = useConfig({
  context: UIContext.CATALOGUE,
  category: computed(() => last(instance.getPath(categoryId.value))),
  provide: true
});

set(ui.theme.value);

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
  return category || { id: "", name: "", title: "" };
});

const title = computed(() => {
  return (categoryId.value ? category.value.title : data.storeHeading) || "";
});

const description = computed(() => {
  if (!categoryId.value) {
    return data.storeSubHeading;
  } else if (ui.activeCategoryDescription.isVisible) {
    return category.value.description;
  }
});

const badge = computed(() => {
  if (!categoryId.value) {
    return data.storeBadge;
  } else if (ui.activeCategoryBadge.isVisible) {
    return data.categoryBadge;
  }
});

// --- context

const widget = computed(() => {
  if (
    (category.value.uiMeta as { widgets?: { dac?: boolean } })?.widgets?.dac ||
    ui.productList.value === PRODUCT_LIST_STYLE.DAC
  ) {
    return WidgetDAC;
  }
  return WidgetGrid;
});

const isFaceted = computed(() => {
  return ui.categoryList.value === LIST_STYLE.GRID_FACET;
});

// --- side effects
onMounted(() => {
  // TODO: Reset the layout until we implement the templates for catalogue
  useLayout({});
  useHeader({});
  useFooter({});
});
</script>
