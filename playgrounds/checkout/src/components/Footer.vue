<template>
  <footer
    class="absolute bottom-0 left-0 z-10 flex w-full items-start justify-center gap-4 px-4 py-8 text-sm sm:flex sm:px-6 lg:px-20"
  >
    <span>&copy; {{ new Date().getFullYear() }} {{ t("footer.title") }}</span>
  </footer>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>
