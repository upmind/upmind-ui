<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR" :currency="false">
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
import { LAYOUT_VARIANTS, Layout } from "@upmind-automation/upmind-ui";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";
import LoginAside from "../components/LoginAside.vue";
</script>
