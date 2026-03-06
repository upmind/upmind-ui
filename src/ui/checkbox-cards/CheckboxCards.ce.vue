<template>
  <ToggleGroupRoot
    v-model="modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(styles.checkboxCards.root, props.class)"
    type="multiple"
    data-testid="checkbox-group"
    v-auto-animate
  >
    <template v-for="(item, index) in items" :key="item.id || index">
      <CheckboxCardItem
        :id="`${item.id}-${index}`"
        :index="index"
        :value="item.value as string"
        :name="item.id"
        :required="props.required"
        :disabled="props.disabled"
        :no-input="props.noInput"
        :class="cn(styles.checkboxCards.input, props.itemClass)"
        :itemClass="styles.checkboxCards.item"
        :checked="includes(modelValue, item.value)"
        :data-testid="`checkbox-item-${kebabCase(item.id) || kebabCase(item.label) || kebabCase(item.name)}`"
        :data-hover="props.dataHover"
        :data-focus="props.dataFocus"
      >
        <Label
          :for="`${item.id}-${index}`"
          :class="styles.checkboxCards.label"
          data-testid="checkbox-label"
        >
          <slot name="item" v-bind="{ item, index }">
            <ItemContent :item="item" @action="emits('action', $event)">
              <template v-if="$slots.append" #append>
                <slot
                  name="append"
                  v-bind="{ item: item.item, option: item }"
                />
              </template>
            </ItemContent>
          </slot>
        </Label>
      </CheckboxCardItem>
    </template>
  </ToggleGroupRoot>
</template>

<script setup lang="ts">
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { useVModel } from "@vueuse/core";
import { ToggleGroupRoot } from "radix-vue";
import { computed } from "vue";
// --- internal
import { ItemContent } from "../item-content";
import { Label } from "../label";
import CheckboxCardItem from "./CheckboxCardItem.vue";
import config from "./checkboxCards.config";
import { cn, useStyles } from "../../utils";
// --- utils
import { includes, kebabCase } from "lodash-es";
// --- types
import type { CheckboxCardsProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<CheckboxCardsProps>(), {
  cursor: "pointer",
  columns: 1
  // --- styles
});

const emits = defineEmits<{
  "update:modelValue": [string[]];
  action: [event: Event];
}>();

defineSlots<{
  /** Provide a checkbox card item */
  item(props: { item: any; index: number }): any;
  /** Content appended after the group inside ItemContent */
  append(props: { item: any; option: any }): any;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  noInput: props.noInput,
  cursor: props.cursor,
  columns: props.columns
}));

const styles = useStyles(
  ["checkboxCards", "checkboxCards.content"],
  meta,
  config,
  props.uiConfig ?? {}
);
</script>
