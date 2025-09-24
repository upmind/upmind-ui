<template>
  <Label
    :for="`${props.name}-${index}`"
    :class="cn(styles.radioCards.item)"
    :data-state="isSelected ? 'checked' : ''"
  >
    <span :class="styles.radioCards.radio">
      <RadioGroupItem
        :id="`${props.name}-${index}`"
        :value="value"
        :name="props.name"
        :required="props.required"
        :disabled="props.disabled"
        :tabindex="isSelected || !modelValue ? 0 : -1"
        :data-state="isSelected ? 'checked' : 'unchecked'"
        :uiConfig="uiConfig"
        @blur="onBlur"
      />
    </span>
    <slot
      name="item"
      v-bind="{
        item: { ...props.item, value }
      }"
    >
      <div class="flex w-full items-start gap-4">
        <div class="flex flex-1 flex-col">
          <header
            v-if="props.label || props.sublabel"
            class="flex items-center justify-between"
          >
            <span class="flex gap-2">
              <h5 :class="styles.radioCards.content.label">Label left</h5>
              <Badge
                variant="muted"
                color="primary"
                label="Default"
                size="sm"
              />
            </span>
            <span class="flex gap-2">
              <h5 :class="styles.radioCards.content.sublabel">Label right</h5>
              <Badge variant="muted" color="promo" label="Default" size="sm" />
            </span>
          </header>
          <p v-if="props.sublabel" :class="styles.radioCards.content.labelRowA">
            Content for sub-row A
          </p>
          <p v-if="props.sublabel" :class="styles.radioCards.content.labelRowB">
            Content for sub-row B
          </p>
        </div>
        <div>
          <Button variant="muted-link" label="Edit" />
        </div>
      </div>
    </slot>
  </Label>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { watchOnce } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import Label from "../label/Label.ce.vue";
import { Button } from "../button";
import { Badge } from "../badge";
import { RadioGroupItem } from "../radio-group";

// --- types
import type { ComputedRef } from "vue";
import type { RadioCardsItemProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RadioCardsItemProps>(), {
  // -- variants
  width: 12,
  isList: false
});

const emits = defineEmits(["focus"]);

const isSelected = computed(() => {
  return props.modelValue === props.value;
});

const meta = computed(() => ({
  isList: props.list,
  width: props.width
}));

const styles = useStyles(
  [
    "radioCards",
    "radioCards.content",
    "radioCards.content.label1",
    "radioCards.content.label2",
    "radioCards.content.label3"
  ],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  radioCards: {
    trigger: string;
    root: string;
    item: string;
    radio: string;
    input: string;
    content: {
      label: string;
      sublabel: string;
      labelRowA: string;
      labelRowB: string;
    };
  };
}>;

const label = computed(() => {
  return props.label || props.item.label;
});

const onBlur = (e: FocusEvent) => {
  if (props.disabled) {
    watchOnce(
      () => props.disabled,
      () => {
        const el = e.target as HTMLElement;
        if (el && el.dataset.state === "checked") {
          el.focus();
        }
      }
    );
  }
};
</script>
