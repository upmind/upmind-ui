<template>
  <Button
    :to="to"
    variant="link"
    icon="arrow-left"
    :label="t(i18nKey)"
    size="lg"
    class="font-medium"
  />
</template>

<script lang="ts" setup>
import { Button } from "@upmind-automation/upmind-ui";
import { useI18n } from "vue-i18n";
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from "vue-router";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    i18nKey?: string;
    to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
  }>(),
  {
    i18nKey: "navigation.back"
  }
);
</script>
