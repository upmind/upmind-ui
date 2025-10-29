<template>
  <component
    :is="button ? Button : Link"
    icon="flip-backward"
    :label="safeLabel"
    :to="to"
    size="lg"
    :variant="button ? 'subtle' : undefined"
    :class="{ 'font-medium': !button }"
  />
</template>

<script lang="ts" setup>
import { Link, Button } from "@upmind-automation/upmind-ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from "vue-router";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
    label?: string;
    button?: boolean;
  }>(),
  {}
);

const safeLabel = computed(() => props.label || t("action.back_to_basket"));
</script>
