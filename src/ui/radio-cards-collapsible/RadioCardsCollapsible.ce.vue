<template>
  <div :class="cn('w-full', props.class)">
    <Collapsible v-model:open="isExpanded">
      <RadioGroup
        :model-value="modelValue"
        :required="props.required"
        :disabled="props.disabled"
        @update:model-value="onSelectionChange"
        :class="cn(styles.radioCards.root, 'gap-0')"
      >
        <RadioCardItem
          v-if="!props.forceOpen && selectedItem"
          data-state="checked"
          :item="selectedItem.item"
          :index="0"
          :name="props.name"
          :label="selectedItem?.label"
          :required="props.required"
          :disabled="props.disabled"
          :model-value="modelValue"
          :columns="props.columns"
          :value="selectedItem.value"
          :minimal="props.minimal"
          :data-testid="`radio-card-${kebabCase(props.label)}`"
          :uiConfig="selectedItemUiConfig"
        >
          <template #item="slotProps">
            <slot name="item" v-bind="slotProps" />
          </template>
        </RadioCardItem>

        <template v-else-if="!props.forceOpen">
          <Skeleton class="col-span-12">
            <RadioCardItem
              :item="{
                title: 'Loading...',
                description: 'Loading...'
              }"
              :index="-1"
              :model-value="modelValue"
              value="-1"
            >
              <template #item="slotProps">
                <slot name="item" v-bind="slotProps" />
              </template>
            </RadioCardItem>
          </Skeleton>
        </template>

        <CollapsibleContent
          :class="
            cn(styles.radioCards.root, 'col-span-12 gap-0 overflow-visible')
          "
        >
          <template
            v-for="(option, index) in displayItems"
            :key="option.id || index"
          >
            <RadioCardItem
              :item="option.item"
              :index="props.forceOpen ? index : index + 1"
              :name="props.name"
              :label="option?.label"
              :required="props.required"
              :disabled="props.disabled"
              :model-value="modelValue"
              :columns="props.columns"
              :value="option.value"
              :class="[
                (!props.forceOpen || index > 0) && 'mt-2',
                props.radioClass
              ]"
              :minimal="props.minimal"
              data-testid="radio-card-item"
              :uiConfig="props.uiConfig"
              @keydown.enter="onSelectionChange(option.value)"
            >
              <template #item="slotProps">
                <slot name="item" v-bind="slotProps" />
              </template>
            </RadioCardItem>
          </template>
        </CollapsibleContent>
      </RadioGroup>

      <slot v-if="!props.forceOpen" name="actions">
        <Button
          :label="label"
          size="sm"
          variant="solid"
          :disabled="props.disabled"
          @click="toggleExpanded"
        />
      </slot>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { kebabCase } from "lodash-es";
// --- internal
// --- components
import { Button } from "../button";
import { Collapsible, CollapsibleContent } from "../collapsible";
import { RadioGroup } from "../radio-group";
import { Skeleton } from "../skeleton";
import RadioCardItem from "./RadioCardItem.vue";
import config from "./radioCards.config";
import { cn, useStyles } from "../../utils";
// --- types
import type { RadioCardsCollapsibleProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<RadioCardsCollapsibleProps>(), {
  // --- props
  overrideIndex: 0,
  useInputGroup: true,
  label: "Change",
  autoCollapse: true,
  forceOpen: false,
  // -- variants
  columns: 1,
  // --- styles
  class: "",
  radioClass: ""
});

const _emits = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:open"): void;
}>();

const modelValue = defineModel<string>("modelValue");
const open = defineModel<boolean>("open");

const isExpanded = computed({
  get: () => props.forceOpen || !!open.value,
  set: (val: boolean) => {
    open.value = val;
  }
});

const meta = computed(() => ({
  isMinimal: props.minimal,
  columns: props.columns
}));

const styles = useStyles("radioCards", meta, config, props.uiConfig ?? {});

const selectedItem = computed(() => {
  return props.items.find(item => item.value === modelValue.value);
});

const displayItems = computed(() => {
  return props.forceOpen
    ? props.items
    : props.items.filter(item => item.value !== modelValue.value);
});

const selectedItemUiConfig = {
  radioCards: {
    input:
      "outline-hidden! ring-0! focus:outline-hidden! focus:ring-0! active:outline-hidden! active:ring-0! focus-visible:outline-hidden! focus-visible:ring-0 ring-0!",
    item: "outline-hidden! ring-0! focus:outline-hidden! focus:ring-0! active:outline-hidden! active:ring-0! focus-visible:outline-hidden! focus-visible:ring-0! ring-0!"
  } as any
};

const toggleExpanded = () => {
  open.value = !open.value;
};

const onSelectionChange = (value: any) => {
  if (!props.required && value === modelValue.value) {
    modelValue.value = undefined;
  } else {
    modelValue.value = value;
  }

  if (props.autoCollapse && !props.forceOpen && value !== undefined) {
    open.value = false;
  }
};
</script>
