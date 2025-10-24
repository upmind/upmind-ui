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

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_TEMPLATE } from "../../../components/header/types";

// --- methods
const { setTemplate, hideLocale } = useFooter();
hideLocale();
setTemplate(FOOTER_TEMPLATE.CANVAS_CARD);

const { setTemplate: setHeaderTemplate } = useHeader();
setHeaderTemplate(HEADER_TEMPLATE.CANVAS_CARD);
</script>
