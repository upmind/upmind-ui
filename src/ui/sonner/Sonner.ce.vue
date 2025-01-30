<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <Sonner
    class="toaster group"
    v-bind="props"
    :toast-options="{
      classes: {
        toast: cn(
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
        actionButton: cn(
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
        closeButton: cn(
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
        // title: cn(
        //   styles.sonner.base.title,
        //   styles.sonner.primary.title,
        //   styles.sonner.secondary.title,
        //   styles.sonner.accent.title,
        //   styles.sonner.success.title,
        //   styles.sonner.error.title,
        //   styles.sonner.warning.title,
        //   styles.sonner.info.title,
        //   styles.sonner.promotion.title,
        //   styles.sonner.destructive.title
        // ),
        // description: cn(
        //   styles.sonner.base.description,
        //   styles.sonner.primary.description,
        //   styles.sonner.secondary.description,
        //   styles.sonner.accent.description,
        //   styles.sonner.success.description,
        //   styles.sonner.error.description,
        //   styles.sonner.warning.description,
        //   styles.sonner.info.description,
        //   styles.sonner.promotion.description,
        //   styles.sonner.destructive.description
        // ),
        // cancelButton: cn(
        //   styles.sonner.base.cancelButton,
        //   styles.sonner.primary.cancelButton,
        //   styles.sonner.secondary.cancelButton,
        //   styles.sonner.accent.cancelButton,
        //   styles.sonner.success.cancelButton,
        //   styles.sonner.error.cancelButton,
        //   styles.sonner.warning.cancelButton,
        //   styles.sonner.info.cancelButton,
        //   styles.sonner.promotion.cancelButton,
        //   styles.sonner.destructive.cancelButton
        // ),
      },
    }"
  />
</template>

<script lang="ts" setup>
// --- external
import { Toaster as Sonner } from "vue-sonner";

// --- internal
import {
  useStyles,
  cn,
  //stylesheet
} from "../../utils";
import config from "./sonner.config";

// --- types
import type { ComputedRef } from "vue";
import { type SonnerProps } from ".";

// -----------------------------------------------------------------------------

const props = defineProps<SonnerProps>();

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
  {},
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  sonner: {
    base: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
    primary: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
    secondary: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
    accent: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
    success: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
    error: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
    warning: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
    info: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
    promotion: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
    destructive: {
      toast: string;
      actionButton: string;
      closeButton: string;
    };
  };
}>;
</script>

<style src="./sonner.css"></style>
