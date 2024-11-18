<template>
  <article class="flex flex-col gap-4">
    <section class="min-h-screen border border-dashed">
      {{ t("offers.empty") }}
    </section>
  </article>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>
