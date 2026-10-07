<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT_HORIZONTAL">
    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="markdown" :flush="true" />
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
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { Layout } from "@upmind-automation/foundation";
import { useSection } from "@upmind-automation/foundation";
import { LAYOUT_VARIANTS } from "@upmind-automation/foundation";
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
