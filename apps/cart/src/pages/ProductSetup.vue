<template>
  <UpmProductSetup :basket-route="{ name: ROUTE.BASKET }" />
</template>

<script lang="ts" setup>
import { UpmProductSetup } from "@upmind-automation/client-vue";
import { ROUTE } from "../router";
</script>
