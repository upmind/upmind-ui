<template>
  <EmailView :email-id="emailId" />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- internal

// --- components
import { EmailView } from "@upmind-automation/client-vue";

// --- types

// -----------------------------------------------------------------------------

const route = useRoute();
const emailId = computed(() => route.params.emailId as string);
</script>
