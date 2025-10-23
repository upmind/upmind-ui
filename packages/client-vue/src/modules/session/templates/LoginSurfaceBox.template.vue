<template>
  <Layout
    :variant="LAYOUT_VARIANTS.SURFACE_BOX"
    :locale="false"
    :currency="false"
  >
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
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import Layout from "../../../components/layout/Layout.vue";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";
</script>
