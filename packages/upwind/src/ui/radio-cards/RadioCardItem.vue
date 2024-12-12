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
        {{ item.label }}
      </slot>
    </Label>
  </div>
</template>

<script setup lang="ts">
// --- internal
import { RadioGroupItem } from "../radio-group";
import { Label } from "../label";
import { cn } from "../../utils";

const props = defineProps<{
  item: any;
  index: number;
  name: string;
  required: boolean;
  disabled: boolean;
  radioClass?: string;
  modelValue: any;
  variants: any;
}>();
</script>
