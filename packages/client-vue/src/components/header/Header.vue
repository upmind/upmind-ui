<template>
  <header :class="styles.header.root" v-show="meta.isVisible">
    <div :class="styles.header.container">
      <div :class="styles.header.left" v-if="meta.hasContent">
        <HeaderBrand v-if="meta.showLogo" />
      </div>

      <div :class="styles.header.right" v-if="meta.hasActions">
        <HeaderActions />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// --- external

// --- internal
import { useHeader } from "./useHeader";
import config from "./header.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import HeaderBrand from "./HeaderBrand.vue";
import HeaderActions from "./HeaderActions.vue";

// --- types
import type { ComputedRef } from "vue";
import type { HeaderProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<HeaderProps>(), {
  visible: undefined,
  template: undefined,
  noSession: undefined,
  noBasket: undefined,
  noLogo: undefined
});

const { meta, templateName } = useHeader(props);

const styles = useStyles(
  ["header"],
  {
    variant: templateName.value
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
