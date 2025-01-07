<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import { TabsContent, type TabsContentProps } from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  TabsContentProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <TabsContent
    :class="
      cn(
        'focus-visible:ring-ring mt-2 w-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        props.class
      )
    "
    v-bind="delegatedProps"
  >
    <slot />
  </TabsContent>
</template>
