<template>
  <div
    :class="cn(variants.radioCards.item, radioClass)"
    :data-state="modelValue === item.value ? 'checked' : 'unchecked'"
  >
    <RadioGroupItem
      :id="`${props.name}-${index}`"
      :value="item.value"
      :name="props.name"
      :required="props.required"
      :disabled="props.disabled"
      :class="variants.radioCards.input"
    />
    <Label
      :for="`${props.name}-${index}`"
      :class="cn(variants.radioCards.label)"
    >
      <slot name="item" v-bind="{ item, index }">
        {{ props.name }}
      </slot>
    </Label>

    <div
      v-if="props.label"
      class="text-emphasis-medium flex cursor-pointer items-center space-x-4 text-nowrap py-1.5 pr-2 text-sm"
      :class="props.expandable ? 'hover:text-emphasis-high' : 'pr-4'"
      @click.stop="$emit('toggle-expanded')"
    >
      {{ props.label }}
      <Icon
        v-if="props.expandable"
        icon="arrow-down"
        size="xs"
        class="mt-0.5 transition-all duration-300"
        :class="props.expanded ? 'rotate-180' : ''"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// --- internal
import { RadioGroupItem } from "../radio-group";
import { cn } from "../../utils";
import Icon from "../icon/Icon.ce.vue";

const props = defineProps<{
  item: any;
  index: number;
  name: string;
  label: string;
  required: boolean;
  disabled: boolean;
  radioClass?: string;
  modelValue: any;
  variants: any;
  expandable?: boolean;
  expanded?: boolean;
}>();

defineEmits<{
  "toggle-expanded": [];
}>();
</script>
