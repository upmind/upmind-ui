<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT">
    <template #content-header>
      <div class="flex h-full flex-col justify-between">
        <HeaderBrand class="pb-12" />
        <LoginHeader />
      </div>
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
import HeaderBrand from "../../../components/header/HeaderBrand.vue";
</script>
