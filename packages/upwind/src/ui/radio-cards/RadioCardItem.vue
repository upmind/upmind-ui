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
      v-if="!props.minify"
      :for="`${props.name}-${index}`"
      :class="cn(variants.radioCards.label, props.label ? '!pr-0' : 'pr-4')"
    >
      <slot
        v-bind="{
          item: { ...props.item, icon: props.item.icon },
        }"
      />
    </Label>

    <Label
      v-if="props.label"
      class="text-emphasis-medium mt-[0.075rem] flex cursor-pointer items-center space-x-4 text-nowrap py-2 pr-2 text-sm"
      :class="props.expandable ? 'hover:text-emphasis-high' : 'w-full'"
      @click="toggleExpanded"
      :for="props.expandable ? '' : `${props.name}-${index}`"
    >
      {{ props.label }}
      <Icon
        v-if="props.expandable"
        icon="arrow-down"
        size="xs"
        class="mt-0.5 transition-all duration-300"
        :class="expanded ? 'rotate-180' : ''"
      />
    </Label>
  </div>
</template>

<script setup lang="ts">
// --- internal
import { RadioGroupItem } from "../radio-group";
import { cn } from "../../utils";
import Icon from "../icon/Icon.ce.vue";
import Label from "../label/Label.ce.vue";
import { ref } from "vue";

const props = defineProps<{
  item: any;
  index: number;
  name: string;
  label?: string;
  required: boolean;
  disabled: boolean;
  modelValue: any;
  variants: any;
  expandable?: boolean;
  minify?: boolean;
  expanded?: boolean;
}>();

const emit = defineEmits<{
  expand: [];
}>();

const toggleExpanded = () => {
  emit("expand");
};
</script>
