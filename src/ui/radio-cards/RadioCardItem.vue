<template>
  <Label
    :for="`${props.name}-${index}`"
    :class="cn(styles.radioCards.item.root, styles.radioCards.item.size)"
    :data-state="isSelected ? 'checked' : ''"
    :data-hover="props.dataHover"
    :data-focus="props.dataFocus"
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
        :data-focus="props.dataFocus"
        :data-hover="props.dataHover"
      />
    </span>
    <slot
      name="item"
      v-bind="{
        item: { ...props.item, value }
      }"
    >
      <div class="flex w-full items-start gap-4">
        <span class="flex flex-1 flex-col">
          <header
            v-if="props.label || props.secondaryLabel"
            class="flex justify-between"
          >
            <span class="flex gap-2">
              <h5 :class="styles.radioCards.content.label">
                {{ props.label }}
              </h5>
              <Badge v-if="props.badge" v-bind="props.badge" size="sm" />
            </span>
            <span class="flex gap-2">
              <Badge
                v-if="props.secondaryBadge"
                v-bind="props.secondaryBadge"
                size="sm"
              />
              <h5 :class="styles.radioCards.content.secondaryLabel">
                {{ props.secondaryLabel }}
              </h5>
            </span>
          </header>
          <p
            v-if="props.description"
            :class="styles.radioCards.content.description"
          >
            {{ props.description }}
          </p>
          <p
            v-if="props.secondaryDescription"
            :class="styles.radioCards.content.secondaryDescription"
          >
            {{ props.secondaryDescription }}
          </p>
        </span>
        <span v-if="props.action" class="leading-none">
          <Link
            v-show="isNil(props.action?.visible) || props.action?.visible"
            v-bind="props.action"
            color="muted"
            size="sm"
            @click.stop="doAction(props.action, $event)"
          />
        </span>
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
import { Link } from "../link";
import { Badge } from "../badge";
import { RadioGroupItem } from "../radio-group";

// --- types
import type { RadioCardsItemActionProps, RadioCardsItemProps } from "./types";
import { isFunction, isString, isNil } from "lodash-es";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RadioCardsItemProps>(), {
  // -- variants
  width: 1
});

const emits = defineEmits<{
  "update:modelValue": [string[]];
  focus: [FocusEvent];
  reject: [Event];
  resolve: [Event];
  click: [Event];
  action: [{ name: string; event: Event }];
}>();

const isSelected = computed(() => {
  return props.modelValue === props.value;
});

const meta = computed(() => ({
  isList: props.list,
  width: props.width
}));

const styles = useStyles(
  ["radioCards", "radioCards.item", "radioCards.content"],
  meta,
  config,
  props.uiConfig ?? {}
);

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
function doAction(item: RadioCardsItemActionProps, $event: Event) {
  $event.preventDefault(); // prevent default form actions as we are handling it ourselves

  if (isFunction(item.handler)) {
    item.handler($event);
    return;
  }

  if (isString(item.handler)) {
    emits("action", {
      name: item.handler,
      event: $event
    });
    return;
  }

  // fallback for submit/reset
  if (item.type === "submit") {
    emits("resolve", $event);
    return;
  } else if (item.type === "reset") {
    emits("reject", $event);
    return;
  }

  emits("click", $event);
}
</script>
