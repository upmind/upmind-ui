<template>
  <ToggleGroupRoot
    v-model="modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(styles.checkboxCards.root, props.class)"
    type="multiple"
    data-testid="checkbox-group"
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
        data-testid="checkbox-item"
        :data-hover="$attrs['data-hover']"
        :data-focus="$attrs['data-focus']"
      >
        <Label
          :for="`${item.id}-${index}`"
          :class="cn(styles.checkboxCards.label)"
          data-testid="checkbox-label"
        >
          <slot name="item" v-bind="{ item, index }">
            <div class="flex w-full items-start gap-4">
              <div class="flex flex-1 flex-col">
                <header
                  v-if="item.label || item.secondaryLabel"
                  class="flex items-center justify-between"
                >
                  <span class="flex gap-2">
                    <h5 :class="styles.checkboxCards.content.label">
                      {{ item.label || item.name }}
                    </h5>
                    <Badge v-if="item.badge" v-bind="item.badge" size="sm" />
                  </span>
                  <span class="flex gap-2">
                    <Badge
                      v-if="item.secondaryBadge"
                      v-bind="item.secondaryBadge"
                      size="sm"
                    />
                    <h5 :class="styles.checkboxCards.content.secondaryLabel">
                      {{ item.secondaryLabel }}
                    </h5>
                  </span>
                </header>
                <p
                  v-if="item.description"
                  :class="styles.checkboxCards.content.description"
                >
                  {{ item.description }}
                </p>
                <p
                  v-if="item.secondaryDescription"
                  :class="styles.checkboxCards.content.secondaryDescription"
                >
                  {{ item.secondaryDescription }}
                </p>
              </div>
              <div v-if="item.action">
                <Button
                  variant="muted-link"
                  :label="item.action"
                  size="sm"
                  @click="onAction"
                />
              </div>
            </div>
          </slot>
        </Label>
      </CheckboxCardItem>
    </template>
  </ToggleGroupRoot>
</template>

<script setup lang="ts">
// ---external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";
import { ToggleGroupRoot } from "radix-vue";
import { includes } from "lodash-es";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./checkboxCards.config";

// --- components
import CheckboxCardItem from "./CheckboxCardItem.vue";
import { Label } from "../label";
import { Button } from "../button";
import { Badge } from "../badge";

// --- types
import type { CheckboxCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<CheckboxCardsProps>(), {
  cursor: "pointer"
  // --- styles
});

const emits = defineEmits<{
  /** Update the model value */
  (e: "update:modelValue", payload: string[]): void;
  (e: "action", payload: any): void;
}>();

defineSlots<{
  /** Provide a checkbox card item */
  item(props: { item: any; index: number }): any;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  // layout: props.layout,
  isList: props.list,
  noInput: props.noInput,
  cursor: props.cursor
}));

const styles = useStyles(
  ["checkboxCards", "checkboxCards.content"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  checkboxCards: {
    trigger: string;
    root: string;
    item: string;
    input: string;
    label: string;
    content: {
      label: string;
      secondaryLabel: string;
      description: string;
      secondaryDescription: string;
    };
  };
}>;

const onAction = (value: any) => {
  emits("action", value);
};
</script>
