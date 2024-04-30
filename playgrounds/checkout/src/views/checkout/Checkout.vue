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

<!-- <script setup>
// IF we choose to use Composition over Oprions API
import { useI18n } from "vue-i18n";
import * as messages from "./locales";
const { locale } = useI18n({ useScope: "global" });

// a glob way of loading messages
// let messages = reduce(
//   import.meta.glob("./locales/*.json", { eager: true }),
//   (result, value, key) => {
//     const locale = key.replace("./locales/", "").replace(".json", "");
//     set(result, locale, value.default);
//     return result;
//   },
//   {}
// );

const { t } = useI18n({ messages });
</script> -->

<script>
import { defineComponent } from "vue";
import * as messages from "./locales";

export default defineComponent({
  name: "Checkout",
  i18n: { messages },
});
</script>
