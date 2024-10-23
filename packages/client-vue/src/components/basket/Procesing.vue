<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? Dialog : 'div'"
    :description="text"
    :open="isOpen"
    :size="size"
    :skrim="skrim"
    :title="title"
    fit="cover"
    no-close
    no-header
    persistent
  >
    <template #header>
      <div />
    </template>

    <section :class="styles.basket.processing.root">
      <Avatar v-bind="avatar" />

      <h3 :class="styles.basket.processing.title">{{ title }}</h3>

      <p :class="styles.basket.processing.text">{{ text }}</p>

      <footer :class="styles.basket.processing.actions">
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :processing="processing"
        />
      </footer>
    </section>
  </component>
</template>

<!-- eslint-disable vue/component-api-style -->
<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";

// --- internal
import { useBasket } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Avatar, Dialog, Button } from "@upmind/upwind";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// --- types
import type { BasketModalProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketModalProps>(), {
  open: true,
  modal: false,
  skrim: "primary",
  size: "app",
  avatar: () => ({
    size: "md",
    shape: "circle",
    color: "primary",
    animatedIcon: "tapping-card",
    fit: "contain",
  }),
});

const { meta } = useBasket();

const styles = useStyles(["basket.processing"], meta, config);

const processing = ref(false);
const isOpen = computed(() => meta.value.isProcessing || props.open);
const hasAction = computed(() => {
  return !isEmpty(props.action);
});

async function doAction() {
  if (isFunction(this.action?.handler)) {
    this.processing = true;
    await this.action.handler();
    this.processing = false;
  }
}
</script>
