<template>
  <section class="requests">
    <h2 class="title">
      Requests <span v-if="isActive">({{ count }})</span>
    </h2>
    <upm-request
      v-for="(request, hash) in requests"
      :key="hash"
      :hash="hash"
    ></upm-request>
  </section>
</template>

<script setup lang="ts">
import UpmRequest from "./Request.vue";
import { inject } from "vue";
import type { UseApiFunctions } from "@/modules/api/types";

const upmind = inject("upmind") as UseApiFunctions;

// attempt to get the data from a server
const { requests, count, isActive } = upmind;
</script>

<style scoped lang="scss">
.requests {
}
</style>
