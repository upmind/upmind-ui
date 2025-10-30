<template>
  <Layout :variant="LAYOUT_VARIANTS.CANVAS_CARD">
    <template #content-header>
      <RegisterHeader />
    </template>

    <template #content>
      <RegisterForm />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- components
import Layout from "../../../components/layout/Layout.vue";
import RegisterHeader from "../components/RegisterHeader.vue";
import RegisterForm from "../components/RegisterForm.vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import { useLayout } from "../../../components/layout/useLayout";

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_TEMPLATE } from "../../../components/header/types";
import { LAYOUT_MODE } from "../../../components/layout/useLayout.types";

useLayout({
  mode: LAYOUT_MODE.CENTERED
});

useFooter({
  template: FOOTER_TEMPLATE.CANVAS_CARD,
  noCurrency: true,
  noLocale: true
});

useHeader({
  template: HEADER_TEMPLATE.CANVAS_CARD,
  noBasket: true,
  noSession: true
});
</script>
