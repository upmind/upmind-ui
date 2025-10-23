<template>
  <Layout
    :variant="LAYOUT_VARIANTS.SURFACE_BOX"
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
import { LAYOUT_VARIANTS, Layout } from "@upmind-automation/upmind-ui";
import RegisterHeader from "../components/RegisterHeader.vue";
import RegisterForm from "../components/RegisterForm.vue";
</script>
