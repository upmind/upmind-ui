<template>
  <Breadcrumb :class="cn(styles.breadcrumb, props.class)">
    <BreadcrumbList>
      <template
        v-for="(item, index) in props.items"
        :key="`breadcrumb-${index}`"
      >
        <BreadcrumbItem>
          <BreadcrumbPage
            v-if="item.current || index === props.items.length - 1"
          >
            {{ item.label }}
          </BreadcrumbPage>
          <BreadcrumbLink v-else v-bind="item" :as="Link">
            {{ item.label }}
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator v-if="index < props.items.length - 1">
          /
        </BreadcrumbSeparator>
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
import BreadcrumbLink from "./BreadcrumbLink.vue";
import BreadcrumbPage from "./BreadcrumbPage.vue";
import BreadcrumbSeparator from "./BreadcrumbSeparator.vue";
import Link from "../link/Link.ce.vue";

// --- types
import type { BreadcrumbConsolidateProps } from "./types";

const props = withDefaults(defineProps<BreadcrumbConsolidateProps>(), {
  items: () => [],
  size: "md",
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
  breadcrumb?: string;
}>;
</script>
