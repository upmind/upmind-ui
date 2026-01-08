<template>
  <Link id="logo" :class="styles.header.link" v-bind="linkProps">
    <picture v-if="logo" :class="styles.header.picture">
      <slot name="logo" :logo="logo">
        <img v-if="logo" :src="logo" :class="styles.header.image" alt="logo" />
      </slot>
      <span class="sr-only">
        {{ t("header.title") }}
      </span>
    </picture>
    <h3 v-else :class="styles.header.name">
      {{ name }}
    </h3>
  </Link>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useRoute, type RouteLocationAsRelativeGeneric } from "vue-router";
import { has } from "lodash-es";

// --- internal
import { useBrand } from "@upmind-automation/headless";
import { useStyles, Link } from "@upmind-automation/upmind-ui";
import config from "./header.config";

// --- components
import { computed } from "vue";

// --- types
import type { ComputedRef } from "vue";

const route = useRoute();
const { name, image } = useBrand();

// -----------------------------------------------------------------------------
const { t } = useI18n();
const props = defineProps<{
  logo?: string;
  storefrontRoute?: RouteLocationAsRelativeGeneric | { href: string } | null;
}>();

const layout = computed(() => {
  return route?.meta?.template;
});

const linkProps = computed(() =>
  has(props.storefrontRoute, "href")
    ? { href: props.storefrontRoute.href as string }
    : {
        to: props.storefrontRoute as RouteLocationAsRelativeGeneric | undefined
      }
);

const logo = computed(
  () => props.logo ?? `${image.value?.full_url}?size=400x400`
);

const styles = useStyles(["header"], { layout }, config);
</script>
