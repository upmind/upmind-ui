<template>
  <Breadcrumb v-if="props.variant !== 'hidden'">
    <BreadcrumbList :class="cn(styles.breadcrumb.root, props.class)">
      <template
        v-for="(item, index) in displayItems"
        :key="`breadcrumb-${index}`"
      >
        <BreadcrumbItem>
          <Link
            v-if="
              (!item.to && !item.href) ||
              item.current ||
              (index === displayItems.length - 1 && !item.to && !item.href)
            "
            class="hover:text-muted! text-faint cursor-default no-underline hover:opacity-100!"
            :size="props.size"
            :focusable="false"
            :label="item.label"
            :icon="item.icon"
          />
          <Link
            v-else
            :to="item?.to"
            :href="item?.href"
            :size="item.icon ? 'sm' : props.size"
            :label="item.label"
            :icon="item.icon"
            color="muted"
            :uiConfig="{ link: { items: '[&>i]:p-[3px]' } } as any"
          />
        </BreadcrumbItem>

        <BreadcrumbSeparator v-if="index < displayItems.length - 1">{{
          props.separator
        }}</BreadcrumbSeparator>
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script lang="ts" setup>
// --- external
import { computed, type ComputedRef } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./breadcrumb.config";

// --- components
import Breadcrumb from "./Breadcrumb.vue";
import BreadcrumbList from "./BreadcrumbList.vue";
import BreadcrumbItem from "./BreadcrumbItem.vue";
import BreadcrumbSeparator from "./BreadcrumbSeparator.vue";
import Link from "../link/Link.ce.vue";

// --- types
import type {
  BreadcrumbConsolidateProps,
  BreadcrumbItem as BreadcrumbItemType
} from "./types";

const props = withDefaults(defineProps<BreadcrumbConsolidateProps>(), {
  items: () => [],
  variant: "visible",
  size: "md",
  separator: "/",
  uiConfig: () => ({}),
  class: ""
});

const displayItems = computed<BreadcrumbItemType[]>(() => {
  const items = props.items;

  if (!items.length || props.variant === "hidden") {
    return [];
  }

  if (props.variant === "last") {
    return [items[items.length - 1]];
  }

  if (props.variant === "condensed" && items.length > 2) {
    return [
      items[0],
      { label: "..." } as BreadcrumbItemType,
      items[items.length - 1]
    ];
  }

  return items;
});

const meta = computed(() => ({
  size: props.size
}));

const styles = useStyles(["breadcrumb"], meta, config, props.uiConfig ?? {});
</script>
