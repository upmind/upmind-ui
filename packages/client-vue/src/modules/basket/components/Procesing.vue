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
    <template #header>
      <div />
    </template>

    <section :class="styles.basket.processing.root">
      <slot name="avatar">
        <Avatar :animated-icon="animatedIcon" color="transparent" size="xl" />
      </slot>

      <h3 :class="styles.basket.processing.title">
        <slot name="title">{{ title }}</slot>
      </h3>

      <p :class="styles.basket.processing.text">
        <slot name="text">{{ text }}</slot>
      </p>

      <footer :class="styles.basket.processing.actions">
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :processing="processing"
        >
          <template #prepend>
            <Icon v-if="action?.prependIcon" :icon="action.prependIcon" />
          </template>
        </Button>
      </footer>
    </section>
  </component>
</template>

<!-- eslint-disable vue/component-api-style -->
<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";

// --- internal
import { useBasket } from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../basket.config";

// --- components
import { Avatar, Dialog, Button, Icon } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { BasketModalProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketModalProps>(), {
  open: true,
  modal: false,
  skrim: "primary",
  size: "2xl",
  animatedIcon: () => ({
    icon: "tapping-card",
    primaryColor: "primary",
    secondaryColor: "secondary",
    size: "4xl",
  }),
});

const { meta } = useBasket();

const styles = useStyles(["basket.processing"], meta, config) as ComputedRef<{
  basket: {
    processing: {
      root: string;
      title: string;
      text: string;
      actions: string;
    };
  };
}>;

const processing = ref(false);
const isOpen = computed(() => meta.value.isProcessing || props.open);
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
