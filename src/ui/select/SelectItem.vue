<script setup lang="ts">
import {
  SelectItem,
  type SelectItemProps,
  SelectItemText,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  SelectItemProps & {
    class?: HTMLAttributes["class"];
    /** Stable identifier for the implicit testid cascade (id → value). */
    id?: string;
    /** Explicit data-* attributes spread onto the rendered option (e.g.
     * `{ "data-test-key": "currency-gbp" }`). Overrides the implicit
     * `select-item-*` testid; the uniform escape hatch across primitives. */
    dataAttrs?: Record<`data-${string}`, string | number | boolean>;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, dataAttrs: __, id: ___, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectItem
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex w-full cursor-default items-center rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        props.class
      )
    "
    :data-test-key="props.dataAttrs?.['data-test-key'] ?? 'select-item'"
    :data-test-value="
      props.dataAttrs?.['data-test-value'] ?? props.id ?? props.value
    "
  >
    <slot name="indicator" />

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
