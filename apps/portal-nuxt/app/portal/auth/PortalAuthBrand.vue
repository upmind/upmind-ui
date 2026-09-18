<template>
  <PortalBrand :label="brandName" to="/login" />
</template>

<script setup lang="ts">
// The wordmark at the top of the form column, where the cart's LTR header puts
// it: no bar, no border, just the mark on the column's own ground.
import { useMockBrandGates } from "~/portal/mock/gates";
import PortalBrand from "~/portal/modules/brand/Brand.vue";

const { brandName } = useMockBrandGates();
</script>
