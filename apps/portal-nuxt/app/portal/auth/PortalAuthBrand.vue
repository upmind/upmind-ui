<template>
  <PortalBrand :label="brandName" to="/login" />
</template>

<script setup lang="ts">
import { useMockBrandGates } from "~/portal/mock/gates";
import PortalBrand from "~/portal/modules/brand/Brand.vue";

const { brandName } = useMockBrandGates();
</script>
