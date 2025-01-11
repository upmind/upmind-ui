<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <Sonner
    class="toaster group"
    v-bind="props"
    :toast-options="{
      classes: {
        toast: cn(
          variants.sonner.base.toast,
          variants.sonner.primary.toast,
          variants.sonner.secondary.toast,
          variants.sonner.accent.toast,
          variants.sonner.success.toast,
          variants.sonner.error.toast,
          variants.sonner.warning.toast,
          variants.sonner.info.toast,
          variants.sonner.promotion.toast,
          variants.sonner.destructive.toast
        ),
        actionButton: cn(
          variants.sonner.base.actionButton,
          variants.sonner.primary.actionButton,
          variants.sonner.secondary.actionButton,
          variants.sonner.accent.actionButton,
          variants.sonner.success.actionButton,
          variants.sonner.error.actionButton,
          variants.sonner.warning.actionButton,
          variants.sonner.info.actionButton,
          variants.sonner.promotion.actionButton,
          variants.sonner.destructive.actionButton
        ),
        closeButton: cn(
          variants.sonner.base.closeButton,
          variants.sonner.primary.closeButton,
          variants.sonner.secondary.closeButton,
          variants.sonner.accent.closeButton,
          variants.sonner.success.closeButton,
          variants.sonner.error.closeButton,
          variants.sonner.warning.closeButton,
          variants.sonner.info.closeButton,
          variants.sonner.promotion.closeButton,
          variants.sonner.destructive.closeButton
        ),
        // title: cn(
        //   variants.sonner.base.title,
        //   variants.sonner.primary.title,
        //   variants.sonner.secondary.title,
        //   variants.sonner.accent.title,
        //   variants.sonner.success.title,
        //   variants.sonner.error.title,
        //   variants.sonner.warning.title,
        //   variants.sonner.info.title,
        //   variants.sonner.promotion.title,
        //   variants.sonner.destructive.title
        // ),
        // description: cn(
        //   variants.sonner.base.description,
        //   variants.sonner.primary.description,
        //   variants.sonner.secondary.description,
        //   variants.sonner.accent.description,
        //   variants.sonner.success.description,
        //   variants.sonner.error.description,
        //   variants.sonner.warning.description,
        //   variants.sonner.info.description,
        //   variants.sonner.promotion.description,
        //   variants.sonner.destructive.description
        // ),
        // cancelButton: cn(
        //   variants.sonner.base.cancelButton,
        //   variants.sonner.primary.cancelButton,
        //   variants.sonner.secondary.cancelButton,
        //   variants.sonner.accent.cancelButton,
        //   variants.sonner.success.cancelButton,
        //   variants.sonner.error.cancelButton,
        //   variants.sonner.warning.cancelButton,
        //   variants.sonner.info.cancelButton,
        //   variants.sonner.promotion.cancelButton,
        //   variants.sonner.destructive.cancelButton
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

const variants = useStyles(
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
  props.upmindUIConfig ?? {} ?? {}
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
