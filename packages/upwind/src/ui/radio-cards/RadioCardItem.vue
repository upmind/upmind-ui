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
    <div
      class="flex w-full flex-col md:flex-row md:justify-between md:space-x-2"
    >
      <Label
        v-if="!props.minify"
        :for="`${props.name}-${index}`"
        :class="
          cn(variants.radioCards.label, props.sublabel ? '!pr-0' : 'pr-4')
        "
      >
        <slot
          name="item"
          v-bind="{
            item: { ...props.item, icon: props.item.icon },
          }"
        />
        <span v-if="props.label">{{ props.label }}</span>
      </Label>

      <Label
        v-if="props.sublabel"
        class="text-emphasis-medium flex cursor-pointer items-center text-nowrap py-2 pr-2 text-sm md:ml-auto md:mt-[0.075rem] md:flex-row md:items-center md:space-x-4"
        :class="props.expandable ? 'hover:text-emphasis-high' : 'w-full'"
        @click="toggleExpanded"
        :for="`${props.name}-${index}`"
      >
        {{ props.sublabel }}
        <Icon
          v-if="props.expandable"
          icon="arrow-down"
          size="xs"
          class="mt-0.5 transition-all duration-300"
          :class="expanded ? 'rotate-180' : ''"
        />
      </Label>
    </div>
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
  index: number | string;
  name?: string;
  label?: string;
  sublabel?: string;
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
