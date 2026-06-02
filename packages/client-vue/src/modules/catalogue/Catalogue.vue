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
      <div :class="styles.products.root" v-auto-animate>
        <aside :class="styles.products.facets.root" v-if="isFaceted">
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
// --- external
import { computed, onMounted, provide } from "vue";
import { useRouteQuery } from "@vueuse/router";
import { useUrlSearchParams } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useProductCategories,
  useBrand,
  ProductSortableProperties,
  RequestSortDirection,
  UIContext
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import config from "./catalogue.config";
import { useLayout } from "../../components/layout/useLayout";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useThemes } from "@upmind-automation/upmind-ui";

// --- components
import { useStyles } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import Breadcrumbs from "./categories/Breadcrumbs.vue";
import CategoriesFacet from "./categories/facet/CategoriesFacet.vue";
import Categories from "./categories/Categories.vue";
import WidgetGrid from "./products/WidgetGrid.vue";
import WidgetDAC from "./products/WidgetDAC.vue";

// --- utils
import { last } from "lodash-es";

// --- types
import type { ProductCategory } from "@upmind-automation/headless";
import type { LAYOUT_VARIANTS } from "../../components/layout";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import { PRODUCT_LIST_STYLE, LIST_STYLE } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<{
  layout?: LAYOUT_VARIANTS;
  categoryRoute: RouteLocationAsRelativeGeneric;
  configureRoute?: RouteLocationAsRelativeGeneric;
}>();

// -----------------------------------------------------------------------------
const { uiCart } = useBrand();
const instance = useProductCategories();
provide("useProductCategories", instance);

const { t } = useI18n();
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

const styles = useStyles(["products", "products.facets"], {}, config);

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
