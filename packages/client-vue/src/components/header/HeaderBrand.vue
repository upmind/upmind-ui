<template>
  <Link id="logo" :to="props.storefrontRoute">
    <picture v-if="logo" class="h-full w-full">
      <slot name="logo" :logo="logo">
        <img
          v-if="logo"
          :src="logo"
          class="h-9 w-auto max-w-32 md:max-w-64"
          alt="logo"
        />
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
  storefrontRoute?: RouteLocationAsRelativeGeneric;
}>();

const layout = computed(() => {
  return route?.meta?.template;
});

const logo = computed(() => props.logo ?? image.value?.full_url);

const styles = useStyles(["header"], { layout }, config) as ComputedRef<{
  header: {
    name: string;
    root: string;
    container: string;
  };
}>;
</script>
