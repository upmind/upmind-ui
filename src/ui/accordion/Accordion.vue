<script lang="ts" setup>
import {
  AccordionRoot,
  type AccordionRootEmits,
  type AccordionRootProps,
  useForwardPropsEmits
} from "radix-vue";

const props = defineProps<AccordionRootProps>();
const emits = defineEmits<AccordionRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <AccordionRoot v-bind="forwarded">
    <slot />
  </AccordionRoot>
</template>
