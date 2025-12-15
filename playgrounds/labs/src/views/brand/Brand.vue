<template>
  <Layout>
    <UpmSection class="max-w-app mx-auto" label="Terms and Conditions">
      <UpmTermsAndConditions />
    </UpmSection>
  </Layout>
</template>

<script setup lang="ts">
import { UpmLayout } from "@upmind-automation/client-vue";
import {
  UpmTermsAndConditions,
  UpmSection
} from "@upmind-automation/client-vue";
</script>
