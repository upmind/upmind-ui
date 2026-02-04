<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <Sonner
    class="toaster group"
    data-testid="sonner-toast"
    data-theme=""
    v-bind="props"
    :toast-options="{
      classes: {
        toast: cn(
          styles.sonner.neutral.toast,
          styles.sonner.success.toast,
          styles.sonner.danger.toast,
          styles.sonner.warning.toast,
          styles.sonner.info.toast,
          styles.sonner.promo.toast
        ),
        actionButton: cn(
          styles.sonner.neutral.actionButton,
          styles.sonner.success.actionButton,
          styles.sonner.danger.actionButton,
          styles.sonner.warning.actionButton,
          styles.sonner.info.actionButton,
          styles.sonner.promo.actionButton
        ),
        closeButton: cn(
          styles.sonner.neutral.closeButton,
          styles.sonner.success.closeButton,
          styles.sonner.danger.closeButton,
          styles.sonner.warning.closeButton,
          styles.sonner.info.closeButton,
          styles.sonner.promo.closeButton
        ),
        icon: cn('w-0! h-0! opacity-0!')
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
      }
    }"
  />
</template>

<script lang="ts" setup>
// --- external
import { Toaster as Sonner } from "vue-sonner";
// --- internal
import config from "./sonner.config";
// --- types
import {
  useStyles,
  cn
  //stylesheet
} from "../../utils";
import type { SonnerProps } from ".";
// -----------------------------------------------------------------------------

const props = defineProps<SonnerProps>();

const styles = useStyles(
  [
    "sonner",
    "sonner.neutral",
    "sonner.success",
    "sonner.danger",
    "sonner.warning",
    "sonner.info",
    "sonner.promo"
  ],
  {},
  config,
  props.uiConfig ?? {}
);
</script>
