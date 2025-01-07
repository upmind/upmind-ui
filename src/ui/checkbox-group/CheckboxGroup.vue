<script setup lang="ts">
import { cn } from "../../utils";
import {
  ListboxContent,
  ListboxRoot,
  type ListboxRootEmits,
  type ListboxRootProps,
  useForwardPropsEmits,
} from "radix-vue";

import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  ListboxRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<ListboxRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ListboxRoot :class="cn('grid gap-2', props.class)" v-bind="forwarded">
    <slot />
  </ListboxRoot>
</template>
