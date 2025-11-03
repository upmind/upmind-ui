<template>
  <Layout>
    <UpmSection class="max-w-app mx-auto" label="Terms and Conditions">
      <UpmTermsAndConditions />
    </UpmSection>
  </Layout>
</template>

<script setup lang="ts">
import { Layout } from "@upmind-automation/upmind-ui";
import {
  UpmTermsAndConditions,
  UpmSection
} from "@upmind-automation/client-vue";
</script>
