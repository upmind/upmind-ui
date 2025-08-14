<template>
  <Breadcrumb>
    <BreadcrumbList :class="cn(styles.breadcrumb.root, props.class)">
      <template
        v-for="(item, index) in props.items"
        :key="`breadcrumb-${index}`"
      >
        <BreadcrumbItem>
          <Button
            v-if="item.current || index === props.items.length - 1"
            variant="link"
            class="no-underline"
            :size="props.size"
            :focusable="false"
            :class="[
              {
                'text-emphasis-high cursor-default':
                  index === props.items.length - 1
              }
            ]"
          >
            {{ item.label }}
          </Button>
          <Button v-else :to="item.to" variant="link" :size="props.size">
            {{ item.label }}
          </Button>
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
import BreadcrumbSeparator from "./BreadcrumbSeparator.vue";
import { Button } from "../button";

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
  breadcrumb: {
    root: string;
    item: string;
  };
}>;
</script>
