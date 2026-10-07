<template>
  <Layout :variant="LAYOUT_VARIANTS.CANVAS_CARD" :mode="LAYOUT_MODE.CENTERED">
    <template #content-header>
      <slot name="hero" />
      <slot name="markdown" />
    </template>

    <template #content>
      <slot
        name="form"
        :active="false"
        :guest-spacing="GUEST_CHECKOUT_SPACING.BELOW"
      />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useFooter } from "../../../components/footer/useFooter";
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { Layout } from "@upmind-automation/foundation";
import { useSection } from "@upmind-automation/foundation";
import { LAYOUT_VARIANTS } from "@upmind-automation/foundation";
import { LAYOUT_MODE } from "@upmind-automation/foundation";
import { GUEST_CHECKOUT_SPACING } from "@upmind-automation/auth";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

const { ui } = useConfig();

onMounted(() => {
  useHeader({
    noBasket: ui.basketAction.isHidden,
    visible: false
  });

  // plain sections (defaults); clears a carded environment left by an
  // enclosed or inset page
  useSection({});

  useFooter({
    visible: false
  });
});
</script>
