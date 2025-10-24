<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL" :currency="false">
    <template #content-header>
      <LoginHeader />
    </template>

    <template #content>
      <LoginForm section />
    </template>

    <template #aside>
      <LoginAside section />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- components
import Layout from "../../../components/layout/Layout.vue";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";
import LoginAside from "../components/LoginAside.vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

// --- methods
const { setTemplate } = useFooter();
setTemplate(FOOTER_TEMPLATE.TWO_COLUMN_RTL);
</script>
