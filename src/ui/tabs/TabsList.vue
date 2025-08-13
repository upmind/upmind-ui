<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import { TabsList, type TabsListProps } from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  TabsListProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <TabsList
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-base-muted text-muted-foreground inline-flex items-center justify-center rounded-lg p-1',
        props.class
      )
    "
  >
    <slot />
  </TabsList>
</template>
