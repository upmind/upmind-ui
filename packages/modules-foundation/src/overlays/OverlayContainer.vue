<template>
  <!-- Modal: a centred Dialog -->
  <DialogRoot
    v-if="isModal"
    :open="open"
    :modal="modal"
    @update:open="onOpenChange"
  >
    <DialogContent
      :close-label="t('action.close')"
      :class="[sizeClass, 'overflow-y-auto', props.class, props.classContent]"
      :dismissable="dismissable"
    >
      <DialogHeader v-if="showHeader" :class="props.classHeader">
        <DialogTitle v-if="title">{{ title }}</DialogTitle>
        <DialogDescription v-if="description">{{
          description
        }}</DialogDescription>
      </DialogHeader>
      <slot />
    </DialogContent>
  </DialogRoot>

  <!-- Drawer: a bottom sheet -->
  <Drawer
    v-else-if="isDrawer"
    :open="open"
    :title="drawerTitle"
    :description="drawerDescription"
    :class="[props.class, props.classContent]"
    :ui="{ header: props.classHeader, body: 'px-0' }"
    @update:open="onOpenChange"
  >
    <slot />
  </Drawer>

  <!-- Custom: render the content bare -->
  <slot v-else />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module overlays/OverlayContainer
 * @description Composes the new lib's Dialog or Drawer parts from the
 * meta-driven overlay props (title/size/dismissable…), with the overlay's
 * content in the default slot. Replaces the old monolithic Dialog/Drawer that
 * took these as props — the chrome lives here, the body is the slot.
 */
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Drawer
} from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { OverlayType } from "@upmind-automation/headless";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------

export interface OverlayContainerProps {
  type?: OverlayType | string;
  open?: boolean;
  modal?: boolean;
  title?: string;
  description?: string;
  /** Old size token; widens the otherwise max-w-lg modal. */
  size?: string;
  /** Show the close affordance + allow Esc/outside-click dismissal. */
  dismissable?: boolean;
  noHeader?: boolean;
  class?: HTMLAttributes["class"];
  classContent?: HTMLAttributes["class"];
  classHeader?: HTMLAttributes["class"];
}

const { t } = useI18n();
const props = withDefaults(defineProps<OverlayContainerProps>(), {
  // A modal overlay dims the page; default true so reka renders the backdrop
  // (an undefined `modal` forwarded to reka skips the overlay entirely).
  modal: true,
  dismissable: true
});

const emit = defineEmits<{
  "update:open": [boolean];
}>();

const isModal = computed(
  () => props.type === OverlayType.MODAL || props.type === "modal"
);
const isDrawer = computed(
  () => props.type === OverlayType.DRAWER || props.type === "drawer"
);

const showHeader = computed(
  () => !props.noHeader && !!(props.title || props.description)
);

// The drawer branch only hands the composed Drawer a title/description while
// the header is shown — matching the dialog branch's noHeader behaviour.
const drawerTitle = computed(() => {
  if (!showHeader.value) return undefined;
  return props.title;
});
const drawerDescription = computed(() => {
  if (!showHeader.value) return undefined;
  return props.description;
});

// Old size tokens → a max-width on the content (default stays max-w-lg).
const SIZE_MAX_WIDTH: Record<string, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  app: "sm:max-w-3xl"
};
const sizeClass = computed(() =>
  props.size ? (SIZE_MAX_WIDTH[props.size] ?? "") : ""
);

function onOpenChange(value: boolean) {
  emit("update:open", value);
}
</script>
