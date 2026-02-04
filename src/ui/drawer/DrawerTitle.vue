<script lang="ts" setup>
import { DrawerTitle } from "vaul-vue";
import { type HtmlHTMLAttributes, computed } from "vue";
import { cn } from "../../utils";
import type { DrawerTitleProps } from "vaul-vue";

const props = defineProps<
  DrawerTitleProps & { class?: HtmlHTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <DrawerTitle
    v-bind="delegatedProps"
    :class="cn('text-lg leading-none font-semibold', props.class)"
  >
    <slot />
  </DrawerTitle>
</template>
