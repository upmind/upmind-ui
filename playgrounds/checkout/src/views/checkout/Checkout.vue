<template>
  <article class="flex flex-col gap-4">
    <section class="h-20 border border-dashed">
      {{ $t("checkout.breadcrumb") }}
    </section>
    <section class="min-h-screen border border-dashed">
      {{ $t("checkout.overview") }}
    </section>
    <section class="min-h-screen border border-dashed">
      {{ $t("checkout.account") }}
    </section>
    <section class="min-h-screen border border-dashed">
      {{ $t("checkout.payment") }}
    </section>
    <section class="min-h-screen border border-dashed">
      {{ $t("checkout.confirmation") }}
    </section>
  </article>
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";

export default defineComponent({
  name: "Checkout",
  i18n: { messages: getLocalMessages("checkout") },
});
</script>
