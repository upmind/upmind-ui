<script lang="ts" setup>
import { TabsList, type TabsListProps } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn, useTestAttrs } from "../../utils";

const props = defineProps<
  TabsListProps & { class?: HTMLAttributes["class"] }
>();

const testAttrs = useTestAttrs({
  key: "tabslist"
});

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return { ...delegated, ...testAttrs };
});
</script>

<template>
  <TabsList
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-base-muted text-muted-foreground inline-flex items-center justify-center rounded p-1',
        props.class
      )
    "
  >
    <slot />
  </TabsList>
</template>
