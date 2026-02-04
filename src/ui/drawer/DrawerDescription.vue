<script lang="ts" setup>
import { DrawerDescription } from "vaul-vue";
import { type HtmlHTMLAttributes, computed } from "vue";
import { cn } from "../../utils";
import type { DrawerDescriptionProps } from "vaul-vue";

const props = defineProps<
  DrawerDescriptionProps & { class?: HtmlHTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <DrawerDescription
    v-bind="delegatedProps"
    :class="cn('text-muted-foreground text-sm', props.class)"
  >
    <slot />
  </DrawerDescription>
</template>
