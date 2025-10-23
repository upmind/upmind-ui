<template>
  <header :class="styles.header.root">
    <div :class="styles.header.container">
      <div :class="styles.header.left">
        <HeaderBrand />
      </div>

      <div :class="styles.header.right">
        <HeaderActions />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import config from "./header.config";
import { useStyles } from "@upmind-automation/upmind-ui";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import HeaderBrand from "./HeaderBrand.vue";
import HeaderActions from "./HeaderActions.vue";

// --- types
import type { ComputedRef } from "vue";
import { LAYOUT_VARIANTS } from "../layout";

const { currentRoute } = useRoutingEngine();

const meta = computed(() => ({
  variant: currentRoute.value?.meta?.template || LAYOUT_VARIANTS.DEFAULT
}));

const styles = useStyles(["header"], meta, config) as ComputedRef<{
  header: {
    root: string;
    container: string;
    left: string;
    right: string;
  };
}>;
</script>
