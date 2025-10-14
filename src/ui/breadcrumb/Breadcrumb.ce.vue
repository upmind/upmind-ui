<template>
  <Breadcrumb>
    <BreadcrumbList :class="cn(styles.breadcrumb.root, props.class)">
      <template
        v-for="(item, index) in props.items"
        :key="`breadcrumb-${index}`"
      >
        <BreadcrumbItem>
          <Link
            v-if="
              (!item.to && !item.href) ||
              item.current ||
              index === props.items.length - 1
            "
            class="hover:text-muted! cursor-default no-underline hover:opacity-100!"
            :size="props.size"
            :focusable="false"
            :label="item.label"
            :color="index === props.items.length - 1 ? 'muted' : 'default'"
          />
          <Link v-else :to="item.to" :size="props.size" :label="item.label" />
        </BreadcrumbItem>

        <BreadcrumbSeparator v-if="index < props.items.length - 1">{{
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
import type { BreadcrumbConsolidateProps } from "./types";

const props = withDefaults(defineProps<BreadcrumbConsolidateProps>(), {
  items: () => [],
  size: "md",
  separator: "/",
  uiConfig: () => ({}),
  class: ""
});

const meta = computed(() => ({
  size: props.size
}));

const styles = useStyles(
  ["breadcrumb"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  breadcrumb: {
    root: string;
    item: string;
  };
}>;
</script>
