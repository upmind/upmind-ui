<template>
  <section class="brand">
    <h2 class="title">Brand is {{ state }}</h2>

    <div>
      Values:
      <code>
        <pre>{{ values }}</pre>
      </code>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBrand } from "@/modules/brand";
const { state, isAvailable, values } = useBrand();
</script>

<style scoped lang="scss">
.brand {
}
</style>
