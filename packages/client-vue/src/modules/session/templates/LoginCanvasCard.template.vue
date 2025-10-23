<template>
  <Layout
    :variant="LAYOUT_VARIANTS.CANVAS_CARD"
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
import { LAYOUT_VARIANTS, Layout } from "@upmind-automation/upmind-ui";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";
</script>
