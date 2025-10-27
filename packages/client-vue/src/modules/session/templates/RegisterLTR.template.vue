<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR">
    <template #content-header>
      <RegisterHeader />
    </template>

    <template #content>
      <RegisterForm section />
    </template>

    <template #aside>
      <RegisterAside class="hidden lg:flex" section />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import Layout from "../../../components/layout/Layout.vue";
import RegisterHeader from "../components/RegisterHeader.vue";
import RegisterForm from "../components/RegisterForm.vue";
import RegisterAside from "../components/RegisterAside.vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_TEMPLATE } from "../../../components/header/types";

// --- methods
useFooter({
  template: FOOTER_TEMPLATE.TWO_COLUMN_LTR,
  noCurrency: true
});

useHeader({
  template: HEADER_TEMPLATE.TWO_COLUMN_LTR
});
</script>
