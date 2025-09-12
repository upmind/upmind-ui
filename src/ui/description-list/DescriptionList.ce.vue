<template>
  <dl
    :class="cn(styles.list.root, props.class)"
    data-testid="description-list"
    v-auto-animate
  >
    <div
      v-for="(item, index) in items"
      :key="`dl-item-${index}`"
      :class="styles.list.item"
      :data-testid="`description-list-item-${kebabCase(item.term)}`"
    >
      <dt :class="cn(styles.list.term)">
        {{ item.term }}
      </dt>
      <dd :class="cn(styles.list.description)">
        {{ item.description }}
      </dd>
    </div>

    <slot />
  </dl>
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed } from "vue";
import { kebabCase } from "lodash-es";

// --- internal
import config from "./descriptionList.config";
import { useStyles, cn } from "../../utils";

// --- types
import type { ComputedRef } from "vue";
import type { DescriptionListProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<DescriptionListProps>(), {
  uiConfig: () => ({ descriptionList: [] }),
  class: ""
});

const meta = computed(() => ({
  hasEmphasis: props.emphasis
}));

const styles = useStyles(
  "list",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  list: {
    root: string;
    term: string;
    description: string;
    item: string;
  };
}>;
</script>
