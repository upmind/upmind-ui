<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? Dialog : 'div'"
    :description="text"
    :open="isOpen"
    :size="size"
    :skrim="skrim"
    :title="title"
    to="#vue-app"
    fit="cover"
    no-close
    no-header
    :dismissable="false"
  >
    <template #header></template>

    <section :class="styles.basket.empty.root">
      <slot name="avatar">
        <Avatar :animated-icon="animatedIcon" color="transparent" size="xl" />
      </slot>

      <h3 :class="styles.basket.empty.title">
        <slot name="title">{{ title }}</slot>
      </h3>

      <p :class="styles.basket.empty.text">
        <slot name="text">{{ text }}</slot>
      </p>

      <footer :class="styles.basket.empty.actions">
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :loading="processing"
          :label="action?.label"
          :color="action?.color"
          :variant="action?.variant"
        >
          <template #prepend>
            <Icon
              v-if="action?.prependIcon"
              :icon="action.prependIcon"
              size="2xs"
            />
          </template>
          <template #append>
            <Icon
              v-if="action?.appendIcon"
              :icon="action.appendIcon"
              size="2xs"
            />
          </template>
        </Button>
      </footer>
    </section>
  </component>
</template>

<!-- eslint-disable vue/component-api-style -->
<script lang="ts" setup>
// --- external
import { ref, computed, type ComputedRef } from "vue";

// --- internal
import { useBasket } from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basket.config";

// --- components
import { Dialog, Button, Avatar, Icon } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// --- types
import type { BasketModalProps } from "./types";
import type { AnimatedIconProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketModalProps>(), {
  open: true,
  modal: false,
  skrim: "primary",
  size: "2xl",
  animatedIcon: () => ({
    icon: "basket",
    delay: 5000,
    primaryColor: "primary",
    secondaryColor: "secondary",
    size: "4xl",
  }),
  fit: "contain",
});

const { meta } = useBasket();

const styles = useStyles(["basket.empty"], meta, config) as ComputedRef<{
  basket: {
    empty: {
      root: string;
      title: string;
      text: string;
      actions: string;
    };
  };
}>;

const processing = ref(false);
const isOpen = computed(() => meta.value.isEmpty || props.open);
const hasAction = computed(() => {
  return !isEmpty(props.action);
});

async function doAction() {
  if (isFunction(props.action?.handler)) {
    processing.value = true;
    await props.action.handler();
    processing.value = false;
  }
}
</script>
