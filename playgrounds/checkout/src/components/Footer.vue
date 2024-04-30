<template>
  <footer
    class="flex w-full items-start justify-center gap-4 px-4 py-8 text-sm sm:flex sm:px-6 lg:px-20"
  >
    <span>@copyright {{ new Date().getFullYear() }} {{ $t("app.title") }}</span>
  </footer>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "UpmHeader",
  components: {},
});
</script>
