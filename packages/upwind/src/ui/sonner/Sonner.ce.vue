<template>
  <sonner
    class="toaster group"
    v-bind="$props"
    :toast-options="{
      classes: {
        toast: mergeStyles(
          styles.sonner.base.toast,
          styles.sonner.primary.toast,
          styles.sonner.secondary.toast,
          styles.sonner.accent.toast,
          styles.sonner.success.toast,
          styles.sonner.error.toast,
          styles.sonner.warning.toast,
          styles.sonner.info.toast,
          styles.sonner.promotion.toast,
          styles.sonner.destructive.toast
        ),
        title: mergeStyles(
          styles.sonner.base.title,
          styles.sonner.primary.title,
          styles.sonner.secondary.title,
          styles.sonner.accent.title,
          styles.sonner.success.title,
          styles.sonner.error.title,
          styles.sonner.warning.title,
          styles.sonner.info.title,
          styles.sonner.promotion.title,
          styles.sonner.destructive.title
        ),
        description: mergeStyles(
          styles.sonner.base.description,
          styles.sonner.primary.description,
          styles.sonner.secondary.description,
          styles.sonner.accent.description,
          styles.sonner.success.description,
          styles.sonner.error.description,
          styles.sonner.warning.description,
          styles.sonner.info.description,
          styles.sonner.promotion.description,
          styles.sonner.destructive.description
        ),
        actionButton: mergeStyles(
          styles.sonner.base.actionButton,
          styles.sonner.primary.actionButton,
          styles.sonner.secondary.actionButton,
          styles.sonner.accent.actionButton,
          styles.sonner.success.actionButton,
          styles.sonner.error.actionButton,
          styles.sonner.warning.actionButton,
          styles.sonner.info.actionButton,
          styles.sonner.promotion.actionButton,
          styles.sonner.destructive.actionButton
        ),
        cancelButton: mergeStyles(
          styles.sonner.base.cancelButton,
          styles.sonner.primary.cancelButton,
          styles.sonner.secondary.cancelButton,
          styles.sonner.accent.cancelButton,
          styles.sonner.success.cancelButton,
          styles.sonner.error.cancelButton,
          styles.sonner.warning.cancelButton,
          styles.sonner.info.cancelButton,
          styles.sonner.promotion.cancelButton,
          styles.sonner.destructive.cancelButton
        ),
        closeButton: mergeStyles(
          styles.sonner.base.closeButton,
          styles.sonner.primary.closeButton,
          styles.sonner.secondary.closeButton,
          styles.sonner.accent.closeButton,
          styles.sonner.success.closeButton,
          styles.sonner.error.closeButton,
          styles.sonner.warning.closeButton,
          styles.sonner.info.closeButton,
          styles.sonner.promotion.closeButton,
          styles.sonner.destructive.closeButton
        ),
      },
    }"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs, type PropType } from "vue";

// --- internal
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./sonner.config";

// --- components
import { Toaster as Sonner, type ToasterProps } from "vue-sonner";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UwSonner",
  components: { Sonner },
  props: {
    invert: { type: Boolean },
    position: { type: String as PropType<ToasterProps["position"]> },
    hotkey: { type: Array as PropType<ToasterProps["hotkey"]> },
    richColors: { type: Boolean },
    expand: { type: Boolean },
    duration: { type: Number },
    gap: { type: Number },
    visibleToasts: { type: Number },
    closeButton: { type: Boolean },
    toastOptions: { type: Object as PropType<ToasterProps["toastOptions"]> },
    class: { type: String },
    style: { type: Object as PropType<CSSStyleDeclaration> },
    offset: { type: [String, Number] },
    dir: { type: String as PropType<ToasterProps["dir"]> },
    icons: { type: Object as PropType<ToasterProps["icons"]> },
    containerAriaLabel: { type: String },
    pauseWhenPageIsHidden: { type: Boolean },
    cn: { type: Function as PropType<ToasterProps["cn"]> },
  },
  setup(props) {
    const styles = useStyles(
      [
        "sonner",
        "sonner.base",
        "sonner.primary",
        "sonner.secondary",
        "sonner.accent",
        "sonner.success",
        "sonner.error",
        "sonner.info",
        "sonner.promotion",
        "sonner.destructive",
        "sonner.warning",
      ],
      toRefs(props),
      config
    );
    return { styles, mergeStyles };
  },
});
</script>

<style scoped>
[data-sonner-toast] [data-icon] {
  height: auto !important;
  width: auto !important;
}
</style>

<styl scoped src="@/assets/main.css" />
