<template>
  <header :class="styles.header.root">
    <div :class="styles.header.container">
      <a id="logo" :class="styles.header.anchor" :href="storefrontUrl">
        <picture v-if="logo" class="h-full w-full">
          <slot name="logo" :logo="logo">
            <img v-if="logo" :src="logo" class="h-9 w-auto" alt="logo" />
          </slot>
          <span class="sr-only">
            {{ t("header.title") }}
          </span>
        </picture>
        <h3 v-else :class="styles.header.name">
          {{ name }}
        </h3>
      </a>

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
import { useStyles } from "@upmind-automation/upmind-ui";
import { useRouter } from "vue-router";

// --- internal
import config from "./header.config";
import upmindLogo from "../../assets/logo.svg";

// --- components
import VHeaderButtons from "./HeaderButtons.vue";
import { computed } from "vue";

// --- types
import type { ComputedRef } from "vue";

const { name, image, isReady, storefrontUrl, uiCart } = useBrand();

await isReady();
const imageUrl = image.value?.full_url;

// -----------------------------------------------------------------------------
const { t } = useI18n();
const props = defineProps<{ logo?: string }>();

const meta = computed(() => {
  return {
    layout: uiCart.value?.layout
  };
});

const logo = computed(() => props.logo ?? imageUrl ?? upmindLogo);

const styles = useStyles(["header"], meta, config) as ComputedRef<{
  header: {
    name: string;
    root: string;
    anchor: string;
    container: string;
  };
}>;
</script>
