<template>
  <div
    :class="cn(variants.radioCards.item)"
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
      <slot
        name="item"
        v-bind="{
          item: props.item,
        }"
      >
        <span v-if="props.label">{{ props.label }}</span>
      </slot>
    </Label>
  </div>
</template>

<script setup lang="ts">
// --- internal
import { RadioGroupItem } from "../radio-group";
import { cn } from "../../utils";
import Label from "../label/Label.ce.vue";

const props = defineProps<{
  item: any;
  index: number;
  name?: string;
  label?: string;
  sublabel?: string;
  required: boolean;
  disabled: boolean;
  modelValue: any;
  variants: any;
}>();
</script>
