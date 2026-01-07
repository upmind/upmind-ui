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
        :data-testid="`checkbox-item-${kebabCase(item.label) || kebabCase(item.name) || index}`"
        :data-hover="props.dataHover"
        :data-focus="props.dataFocus"
      >
        <Label
          :for="`${item.id}-${index}`"
          :class="styles.checkboxCards.label"
          data-testid="checkbox-label"
        >
          <slot name="item" v-bind="{ item, index }">
            <article :class="styles.checkboxCards.content.root">
              <header class="flex w-full items-start justify-between gap-4">
                <div class="flex flex-1 items-center gap-2">
                  <p :class="styles.checkboxCards.content.label">
                    {{ item.label || item.name }}
                  </p>
                  <Badge v-if="item.badge" v-bind="item.badge" size="sm" />
                </div>

                <div
                  v-if="item.secondaryLabel || item.secondaryBadge"
                  class="flex items-center gap-2"
                >
                  <Badge
                    v-if="item.secondaryBadge"
                    v-bind="item.secondaryBadge"
                    size="sm"
                  />
                  <p
                    v-if="item.secondaryLabel"
                    :class="styles.checkboxCards.content.secondaryLabel"
                  >
                    {{ item.secondaryLabel }}
                  </p>
                </div>

                <div
                  v-if="item.action"
                  :class="styles.checkboxCards.content.action"
                >
                  <Link
                    v-show="isNil(item.action.visible) || item.action.visible"
                    v-bind="item.action"
                    color="muted"
                    size="sm"
                    @click.stop="doAction(item.action, $event)"
                  />
                </div>
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
            </article>
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
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./checkboxCards.config";

// --- components
import CheckboxCardItem from "./CheckboxCardItem.vue";
import { Label } from "../label";
import { Link } from "../link";
import { Badge } from "../badge";

// --- utils
import { includes, isFunction, isString, isNil, kebabCase } from "lodash-es";

// --- types
import type { CheckboxCardsItemActionProps, CheckboxCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<CheckboxCardsProps>(), {
  cursor: "pointer",
  width: 1
  // --- styles
});

const emits = defineEmits<{
  "update:modelValue": [string[]];
  reject: [Event];
  resolve: [Event];
  click: [Event];
  action: [{ name: string; event: Event }];
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
  isList: props.list,
  noInput: props.noInput,
  cursor: props.cursor,
  width: props.width
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
      root: string;
      label: string;
      secondaryLabel: string;
      description: string;
      secondaryDescription: string;
      action: string;
    };
  };
}>;

function doAction(item: CheckboxCardsItemActionProps, $event: Event) {
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
