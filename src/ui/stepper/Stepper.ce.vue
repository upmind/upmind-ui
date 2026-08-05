<template>
  <Stepper
    v-model="modelValue"
    :default-value="props.defaultValue"
    :orientation="props.orientation"
    :linear="props.linear"
    :class="cn(styles.stepper.root, props.class)"
  >
    <template v-for="(item, index) in steps" :key="`stepper-item-${item.step}`">
      <StepperItem
        :step="item.step"
        :disabled="item.disabled"
        :completed="item.completed"
        :class="cn(styles.stepper.item, props.itemClass)"
      >
        <slot name="item" v-bind="{ item, index }">
          <StepperSeparator
            v-if="index < steps.length - 1"
            :class="styles.stepper.separator"
          />
          <StepperTrigger :class="styles.stepper.trigger">
            <StepperIndicator :class="styles.stepper.indicator">
              <slot name="indicator" v-bind="{ item, index }">
                <Icon v-if="item.completed" icon="check" size="nano" />
                <Icon v-else-if="item.icon" :icon="item.icon" size="nano" />
                <template v-else>{{ item.step }}</template>
              </slot>
            </StepperIndicator>
          </StepperTrigger>

          <div
            v-if="item.title || item.description"
            :class="styles.stepper.content"
          >
            <StepperTitle v-if="item.title" :class="styles.stepper.title">
              {{ item.title }}
            </StepperTitle>
            <StepperDescription
              v-if="item.description"
              :class="styles.stepper.description"
            >
              {{ item.description }}
            </StepperDescription>
          </div>
        </slot>
      </StepperItem>
    </template>
  </Stepper>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Icon } from "../icon";
import config from "./stepper.config";
import Stepper from "./Stepper.vue";
import StepperDescription from "./StepperDescription.vue";
import StepperIndicator from "./StepperIndicator.vue";
import StepperItem from "./StepperItem.vue";
import StepperSeparator from "./StepperSeparator.vue";
import StepperTitle from "./StepperTitle.vue";
import StepperTrigger from "./StepperTrigger.vue";
import { cn, useStyles } from "../../utils";
import type { StepperProps } from "./types";

const props = withDefaults(defineProps<StepperProps>(), {
  // --- props
  steps: () => [],
  orientation: "horizontal",
  linear: false,
  defaultValue: 1,
  // --- styles
  uiConfig: () => ({
    stepper: {
      root: [],
      item: [],
      trigger: [],
      indicator: [],
      content: [],
      title: [],
      description: [],
      separator: []
    }
  }),
  class: "",
  itemClass: ""
});

const modelValue = defineModel<number>();

const meta = computed(() => ({
  orientation: props.orientation
}));

const styles = useStyles(["stepper"], meta, config, props.uiConfig ?? {});
</script>
