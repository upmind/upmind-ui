<script setup lang="ts">
import { cn } from "../../utils";
import {
  ListboxContent,
  ListboxRoot,
  ListboxGroup,
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
    <ListboxContent>
      <ListboxGroup :class="cn('grid w-full gap-2', props.class)">
        <slot />
      </ListboxGroup>
    </ListboxContent>
  </ListboxRoot>
</template>
