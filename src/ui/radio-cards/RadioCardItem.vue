<template>
  <div
    :class="cn(styles.radioCards.item)"
    :data-state="modelValue === item.value ? 'checked' : 'unchecked'"
  >
    <RadioGroupItem
      :id="`${props.name}-${index}`"
      :value="item.value"
      :name="props.name"
      :required="props.required"
      :disabled="props.disabled"
      :class="styles.radioCards.input"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <Label :for="`${props.name}-${index}`" :class="cn(styles.radioCards.label)">
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
import { ref, watch, nextTick } from "vue";
import { useFocus } from "@vueuse/core";
const props = defineProps<{
  item: any;
  index: number;
  name?: string;
  label?: string;
  sublabel?: string;
  required: boolean;
  disabled: boolean;
  modelValue: any;
  styles: any;
}>();

const emits = defineEmits(["focus"]);

const focusedElement = ref<HTMLElement | null>(null);

const handleFocus = (event: FocusEvent) => {
  focusedElement.value = event.target as HTMLElement;
  emits("focus", event);
};

const handleBlur = () => {
  if (!props.disabled) {
    focusedElement.value = null;
  }
};

watch(
  () => props.disabled,
  isDisabled => {
    if (!isDisabled && focusedElement.value) {
      nextTick(() => {
        const { focused } = useFocus(focusedElement.value);
        focused.value = true;
      });
    }
  }
);
</script>
