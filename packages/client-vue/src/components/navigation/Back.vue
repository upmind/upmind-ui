<template>
  <Button
    :to="to"
    variant="link"
    icon="arrow-left"
    :label="safeLabel"
    size="lg"
    class="font-medium"
  />
</template>

<script lang="ts" setup>
import { Button } from "@upmind-automation/upmind-ui";
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
  }>(),
  {}
);

const safeLabel = computed(() => props.label || t("action.back_to_basket"));
</script>
