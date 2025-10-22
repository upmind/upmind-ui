<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR" :currency="false">
    <template #content-header>
      <RegisterHeader />
    </template>

    <template #content>
      <RegisterForm />
    </template>

    <template #aside>
      <RegisterAside />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import RegisterHeader from "./components/register/RegisterHeader.vue";
import RegisterForm from "./components/register/RegisterForm.vue";
import RegisterAside from "./components/register/RegisterAside.vue";
</script>
