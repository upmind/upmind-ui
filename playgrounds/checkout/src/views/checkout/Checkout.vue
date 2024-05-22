<template>
  <article class="flex flex-col gap-4">
    <upm-breadcrumb />
    <section id="overview" class="min-h-screen border border-dashed">
      {{ $t("checkout.overview") }}
    </section>
    <section id="account" class="min-h-screen border border-dashed">
      {{ $t("checkout.account") }}
    </section>
    <section id="payment" class="min-h-screen border border-dashed">
      {{ $t("checkout.payment") }}
    </section>
    <section id="confirmation" class="min-h-screen border border-dashed">
      {{ $t("checkout.confirmation") }}
    </section>
  </article>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// -- components
import UpmBreadcrumb from "./components/Breadcrumb.vue";

// -- utils
import { getLocalMessages } from "@/utils";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Checkout",
  i18n: { messages: getLocalMessages("checkout") },
  components: { UpmBreadcrumb },
  setup() {
    return {};
  },
  mounted() {
    // force the route to have a hash of the first step
    if (!this.$route?.hash) this.$router.push({ hash: "#overview" });
  },
});
</script>
