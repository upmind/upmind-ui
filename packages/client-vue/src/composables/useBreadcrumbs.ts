import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { useI18n } from "vue-i18n";
import { BreadcrumbVariant, QUERY_PARAMS } from "@upmind-automation/headless";
import { has } from "lodash-es";
import type { StorefrontRoute } from "../types";
import type { BreadcrumbVariant as UIBreadcrumbVariant } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export interface BreadcrumbCategory {
  id: string;
  label: string;
}

export interface UseBreadcrumbItemsOptions {
  categories: MaybeRefOrGetter<BreadcrumbCategory[]>;
  route: MaybeRefOrGetter<RouteLocationAsRelativeGeneric | undefined>;
  storefrontRoute?: MaybeRefOrGetter<StorefrontRoute | undefined>;
  variant?: MaybeRefOrGetter<BreadcrumbVariant | undefined>;
  selectedId?: MaybeRefOrGetter<string | undefined>;
  currentItem?: MaybeRefOrGetter<{ label: string } | undefined>;
  queryParams?: MaybeRefOrGetter<Record<string, any>>;
  showStorefront?: MaybeRefOrGetter<boolean>;
  showLastCategory?: MaybeRefOrGetter<boolean>;
  onSelect?: (category: BreadcrumbCategory) => void;
}

export const useBreadcrumbs = (options: UseBreadcrumbItemsOptions) => {
  const uiVariant = computed<UIBreadcrumbVariant>(() => {
    const variant = toValue(options.variant);
    const variantMap: Record<BreadcrumbVariant, UIBreadcrumbVariant> = {
      [BreadcrumbVariant.HIDDEN]: "hidden",
      [BreadcrumbVariant.CONDENSED]: "condensed",
      [BreadcrumbVariant.PARENT]: "parent",
      [BreadcrumbVariant.VISIBLE]: "visible"
    };
    return variantMap[variant as BreadcrumbVariant] ?? "visible";
  });

  const { t } = useI18n();

  const items = computed(() => {
    let categories = toValue(options.categories);
    const route = toValue(options.route);
    const storefrontRoute = toValue(options.storefrontRoute) ?? route;
    const queryParams = toValue(options.queryParams) ?? {};
    const selectedId = toValue(options.selectedId);
    const currentItem = toValue(options.currentItem);
    const showStorefront = toValue(options.showStorefront) ?? true;
    const showLastCategory = toValue(options.showLastCategory) ?? true;
    const items: any[] = [];

    // Exclude last category if configured
    if (!showLastCategory && categories.length > 0) {
      categories = categories.slice(0, -1);
    }

    // Storefront
    if (storefrontRoute && showStorefront) {
      const isHref = has(storefrontRoute, "href");
      const storefront = isHref
        ? { href: (storefrontRoute as { href: string }).href }
        : { to: storefrontRoute };
      items.push({
        label: t("text.shop"),
        ...storefront,
        current: !selectedId && !categories.length
      });
    }

    // Categories
    categories.forEach(category => {
      const item: any = {
        label: category.label,
        current: selectedId ? category.id === selectedId : false
      };

      if (route && !has(route, "href")) {
        item.to = {
          ...route,
          query: {
            ...queryParams,
            [QUERY_PARAMS.CATEGORY_ID]: category.id
          }
        };
      }

      if (options.onSelect) {
        item.handler = () => options.onSelect!(category);
      }

      items.push(item);
    });

    // Current item
    if (currentItem) {
      items.push({
        label: currentItem.label,
        current: true
      });
    }

    return items;
  });

  return {
    items,
    variant: uiVariant
  };
};
