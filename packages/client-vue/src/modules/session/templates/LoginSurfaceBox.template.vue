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
import Layout from "../../../components/layout/Layout.vue";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";

// --- types
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";
</script>
