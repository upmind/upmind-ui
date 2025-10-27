<template>
  <header :class="styles.header.root" v-show="meta.isVisible">
    <div :class="styles.header.container">
      <div :class="styles.header.left">
        <template v-if="meta.hasContent">
          <HeaderBrand v-if="meta.showLogo" />
        </template>
      </div>

      <div :class="styles.header.right">
        <HeaderActions v-if="meta.hasActions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// --- internal
import { useHeader } from "./useHeader";
import config from "./header.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import HeaderBrand from "./HeaderBrand.vue";
import HeaderActions from "./HeaderActions.vue";

// --- types
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
const { meta, templateName } = useHeader();

const styles = useStyles(
  ["header"],
  {
    variant: templateName
  },
  config
) as ComputedRef<{
  header: {
    root: string;
    container: string;
    left: string;
    right: string;
  };
}>;
</script>
