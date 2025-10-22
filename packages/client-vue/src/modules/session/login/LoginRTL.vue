<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL" :currency="false">
    <template #content-header>
      <LoginHeader />
    </template>

    <template #content>
      <LoginForm />
    </template>

    <template #aside>
      <LoginAside />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";
import Layout from "../../../components/layout/Layout.vue";
import LoginHeader from "./components/LoginHeader.vue";
import LoginForm from "./components/LoginForm.vue";
import LoginAside from "./components/LoginAside.vue";
</script>
