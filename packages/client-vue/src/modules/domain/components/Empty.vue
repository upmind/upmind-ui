<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? Drawer : 'div'"
    :modelValue="isOpen"
    size="xl"
    :dismissable="false"
    fit="cover"
    skrim="light"
  >
    <section :class="styles.domain.empty.root">
      <Avatar v-bind="avatar" />

      <h3 :class="styles.domain.empty.title">{{ title }}</h3>

      <p :class="styles.domain.empty.text">{{ text }}</p>

      <footer :class="styles.domain.empty.actions">
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :loading="processing"
        />
      </footer>
    </section>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../config.cva";

// --- custom elements
import { Avatar, Button, Drawer } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// --- types
import type { AvatarProps, ButtonProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
export interface ActionProps extends ButtonProps {
  type?: HTMLButtonElement["type"];
  handler?: () => Promise<void>;
}

const props = withDefaults(
  defineProps<{
    modal?: boolean;
    title?: string;
    text?: string;
    action?: ActionProps;
    modelValue?: boolean;
    avatar?: AvatarProps;
  }>(),
  {
    modelValue: true,
    avatar: () => ({
      size: "lg",
      shape: "circle",
      color: "primary",
      icon: "basket",
      fit: "contain",
    }),
  }
);
// props: {
//   modal: { type: Boolean },
//   title: { type: String },
//   text: { type: String },
//   action: { type: Object, default: () => null },
//   modelValue: { type: Boolean, default: true },
//   avatar: {
//     type: Object,
//     default: () => ({
//       size: "lg",
//       shape: "circle",
//       color: "primary",
//       icon: "basket",
//       fit: "contain",
//     }),
//   },
// },

const styles = useStyles(["domain.empty"], {}, config);
const processing = ref(false);

const isOpen = computed(() => {
  const value = true; // by default
  return value || props.modelValue;
});
const hasAction = computed(() => {
  return !isEmpty(props.action);
});

function doAction() {
  if (isFunction(props.action?.handler)) {
    processing.value = true;
    props.action.handler().finally(() => {
      processing.value = false;
    });
  }
}
</script>
.
