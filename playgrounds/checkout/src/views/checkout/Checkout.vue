<template>
  <article class="flex flex-col">
    <upm-breadcrumb />

    <pre>{{ meta }}</pre>

    <section
      id="overview"
      class="flex min-h-[70vh] flex-col items-center justify-center gap-8 border border-dashed py-20 text-center"
    >
      {{ $t("checkout.overview") }}

      <div class="flex items-center justify-center">
        <span class="relative inline-flex items-center gap-2 pr-3">
          <upw-avatar
            :key="items?.length"
            v-if="items?.length"
            size="xs"
            class="absolute -top-2 right-0 bg-primary text-xs text-primary-content"
          >
            {{ items.length }}
          </upw-avatar>

          <upw-icon icon="basket" size="2xl" />

          <span class="sr-only">{{ $t("header.checkout") }}</span>
        </span>
      </div>
    </section>

    <section
      id="account"
      class="flex min-h-[70vh] flex-col items-start justify-start py-20"
    >
      <upm-session />
    </section>

    <section
      id="payment"
      class="min-h-72 min-h-[70vh] border border-dashed py-20"
    >
      {{ $t("checkout.payment") }}
    </section>

    <section
      id="confirmation"
      class="min-h-72 min-h-[70vh] border border-dashed py-20"
    >
      {{ $t("checkout.confirmation") }}
    </section>
  </article>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// -- components
import UpmBreadcrumb from "./components/Breadcrumb.vue";
import { UpmSession, useBasket, UpwIcon, UpwAvatar } from "@upmind/client-vue";
// -- utils
import { getLocalMessages } from "@/utils";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Checkout",
  i18n: { messages: getLocalMessages("checkout") },
  components: { UpmBreadcrumb, UpmSession, UpwIcon, UpwAvatar },
  setup() {
    const { items, meta } = useBasket();

    return {
      items,
      meta,
    };
  },
  watch: {
    meta: "scrollTo",
  },
  mounted() {
    this.scrollTo();
  },

  methods: {
    scrollTo() {
      // force the route to have a hash of the appropriate step

      if (!this.$route?.hash && !this.meta.isLoading) {
        if (!this.meta.hasProducts || !this.meta.hasFields) {
          this.$router.push({ hash: "#overview" });
        } else if (!this.meta.hasAccount) {
          this.$router.push({ hash: "#account" });
        } else {
          this.$router.push({ hash: "#payment" });
        }
      }
    },
  },
});
</script>
