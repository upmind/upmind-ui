<template>
  <Layout :variant="LAYOUT_VARIANTS.CANVAS_CARD">
    <template #content-header>
      <LoginHeader />
    </template>

    <template #content>
      <LoginForm />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- components
import Layout from "../../../components/layout/Layout.vue";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_TEMPLATE } from "../../../components/header/types";

// --- methods
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
