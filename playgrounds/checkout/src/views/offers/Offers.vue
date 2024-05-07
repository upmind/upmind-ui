<template>
  <article class="flex flex-col gap-4">
    <section class="min-h-screen border border-dashed">
      {{ $t("offers.empty") }}
    </section>
  </article>
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";

export default defineComponent({
  name: "Offers",
  i18n: { messages: getLocalMessages("offers") },
});
</script>
