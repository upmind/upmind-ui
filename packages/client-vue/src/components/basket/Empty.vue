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

    <section :class="styles.basket.empty.root">
      <Avatar v-bind="avatar" />

      <h3 :class="styles.basket.empty.title">{{ title }}</h3>

      <p :class="styles.basket.empty.text">{{ text }}</p>

      <footer :class="styles.basket.empty.actions">
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :loading="processing"
        >
          <Icon
            v-if="action?.prependIcon"
            :icon="action.prependIcon"
            size="xs"
          />
          {{ action?.label }}
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
import { useBasket } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Avatar, Dialog, Button, Icon } from "@upmind/upwind";

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
    icon: "basket",
    fit: "contain",
  }),
});

const { meta } = useBasket();

const styles = useStyles(["basket.empty"], meta, config);

const processing = ref(false);
const isOpen = computed(() => meta.value.isEmpty || props.open);
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
