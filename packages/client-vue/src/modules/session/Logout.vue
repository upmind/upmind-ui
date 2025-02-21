<template>
  <Logout />
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// -- components
import Logout from "../system/Logout.vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();
const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;
</script>
