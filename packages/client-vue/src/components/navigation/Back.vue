<template>
  <component
    :is="button ? Button : Link"
    :label="safeLabel"
    :icon="icon"
    :to="to"
    :href="href"
    :size="size"
    v-bind="styleProps"
    class="self-start"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Link, Button } from "@upmind-automation/upmind-ui";
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from "vue-router";
import type { BackProps } from "./types";

const { t } = useI18n();

const props = withDefaults(defineProps<BackProps>(), {
  size: "lg",
  color: "muted"
});

const safeLabel = computed(() => props.label || t("action.back_to_basket"));

// Button styles via variant; Link via color — bind only the one in play.
const styleProps = computed(() => {
  if (props.button) return { variant: "subtle" };
  return { color: props.color };
});
</script>
