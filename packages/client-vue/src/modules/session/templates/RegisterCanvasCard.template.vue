<template>
  <Layout
    :variant="LAYOUT_VARIANTS.CANVAS_CARD"
    :locale="false"
    :currency="false"
  >
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

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

// --- methods
const { setTemplate } = useFooter();
setTemplate(FOOTER_TEMPLATE.CANVAS_CARD);
</script>
