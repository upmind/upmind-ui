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
  <ListboxRoot class="w-full" v-bind="forwarded">
    <ListboxContent :class="cn('grid gap-2 w-full', props.class)">
      <slot />
    </ListboxContent>
  </ListboxRoot>
</template>
