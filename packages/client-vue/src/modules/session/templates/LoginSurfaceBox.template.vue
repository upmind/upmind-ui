<template>
  <Layout :variant="LAYOUT_VARIANTS.SURFACE_BOX">
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
const { setTemplate, hideLocale } = useFooter();
hideLocale();

setTemplate(FOOTER_TEMPLATE.SURFACE_BOX);

const { setTemplate: setHeaderTemplate } = useHeader();
setHeaderTemplate(HEADER_TEMPLATE.SURFACE_BOX);
</script>
