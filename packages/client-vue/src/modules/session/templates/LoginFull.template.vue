<template>
  <Layout :variant="LAYOUT_VARIANTS.FULL">
    <template #navigation>
      <Back />
    </template>

    <template #content-header>
      <div class="mx-auto flex max-w-2xl flex-col gap-12">
        <LoginHeader />
        <LoginForm />
      </div>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- components
import Layout from "../../../components/layout/Layout.vue";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";
import Back from "../components/Back.vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_TEMPLATE } from "../../../components/header/types";

// --- methods
useHeader({
  template: HEADER_TEMPLATE.FULL
});

useFooter({
  template: FOOTER_TEMPLATE.FULL,
  noCurrency: true
});
</script>
