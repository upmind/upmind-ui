<template>
  <header :class="styles.header.root">
    <div :class="styles.header.container">
      <Link id="logo" :class="styles.header.anchor" v-bind="storefrontRoute">
        <picture v-if="logo" class="h-full w-full">
          <slot name="logo" :logo="logo">
            <img
              v-if="logo"
              :src="logo"
              class="h-9 w-auto max-w-44 md:max-w-64"
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

      <VHeaderButtons>
        <template #actions> <slot name="actions" /></template>
      </VHeaderButtons>
    </div>
  </header>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useBrand } from "@upmind-automation/headless";
import { useStyles, Link } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./header.config";

// --- components
import VHeaderButtons from "./HeaderButtons.vue";
import { computed } from "vue";

// --- types
import type { ComputedRef } from "vue";

const { name, image, storefrontRoute, uiCart } = useBrand();

// -----------------------------------------------------------------------------
const { t } = useI18n();
const props = defineProps<{ logo?: string }>();

const meta = computed(() => {
  return {
    layout: uiCart.value?.layout
  };
});

const logo = computed(() => props.logo ?? image.value?.full_url);

const styles = useStyles(["header"], meta, config) as ComputedRef<{
  header: {
    name: string;
    root: string;
    anchor: string;
    container: string;
  };
}>;
</script>
