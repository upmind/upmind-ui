<script setup lang="ts">
import {
  ListboxContent,
  ListboxRoot,
  ListboxGroup,
  type ListboxRootEmits,
  type ListboxRootProps,
  useForwardPropsEmits
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { assign } from "lodash-es";
import { cn, useDisabled } from "../../utils";

const props = defineProps<
  ListboxRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<ListboxRootEmits>();

const isDisabled = useDisabled(() => props.disabled);

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return assign(delegated, { disabled: isDisabled.value });
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
