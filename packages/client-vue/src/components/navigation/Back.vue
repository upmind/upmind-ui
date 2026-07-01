<template>
  <component
    :is="button ? Button : Link"
    :label="safeLabel"
    :to="to"
    :href="href"
    size="lg"
    :variant="button ? 'subtle' : undefined"
    :color="!button ? 'muted' : undefined"
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

const { t } = useI18n();

const props = withDefaults(
  defineProps<
    {
      label?: string;
      button?: boolean;
    } & (
      | {
          to:
            | string
            | RouteLocationAsRelativeGeneric
            | RouteLocationAsPathGeneric;
          href?: never;
        }
      | { href: string; to?: never }
      | { to?: undefined; href?: undefined }
    )
  >(),
  {}
);

const safeLabel = computed(() => props.label || t("action.back_to_basket"));
</script>
