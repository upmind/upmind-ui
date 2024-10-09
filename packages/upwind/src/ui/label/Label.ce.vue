<template>
  <Label
    v-bind="delegatedProps"
    :class="
      cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        props.class
      )
    "
  >
    <slot></slot>
  </Label>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Label } from "radix-vue";
import { cn } from "../../utils";
import type { LabelProps } from ".";
import { omit } from "lodash-es";

const props = withDefaults(defineProps<LabelProps>(), {
  upwindConfig: () => ({ label: {} }),
  class: "",
});

const delegatedProps = computed(() =>
  omit(props, ["class", "upwindConfig", "label"])
);
</script>
