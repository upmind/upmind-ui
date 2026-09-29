<template>
  <PortalBrand :label="name ?? ''" to="/login" />
</template>

<script setup lang="ts">
import { useBrand } from "@upmind-automation/headless";
import PortalBrand from "~/portal/modules/brand/Brand.vue";

const { name } = useBrand();
</script>
