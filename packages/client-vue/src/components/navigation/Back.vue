<template>
  <Link class="flex items-center gap-x-2" :to="props.to">
    <Icon icon="arrow-left" size="2xs" />
    {{ t(props.i18nKey) }}
  </Link>
</template>

<script lang="ts" setup>
import { Link, Icon } from "@upmind-automation/upmind-ui";
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
