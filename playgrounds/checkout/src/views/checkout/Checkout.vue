<template>
  <article class="flex flex-col">
    <upw-steps
      :model-value="activeSection"
      :steps="steps"
      :loading="meta.isLoading"
      @update:model-value="isScrolling = true"
    >
      <template #actions>
        <upw-button
          :disabled="!meta.isReadyForCheckout || meta.isProcessing"
          @click.prevent="doCheckout"
          color="primary"
          class="ml-auto"
        >
          Submit order and pay
        </upw-button>
      </template>
    </upw-steps>

    <pre>{{ meta }}</pre>

    <section
      id="overview"
      class="flex min-h-[70vh] flex-col items-center justify-center gap-8 border border-dashed py-20 text-center"
      v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
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
      v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
    >
      <upm-session />
    </section>

    <section
      id="payment"
      class="min-h-[70vh] border border-dashed py-20"
      v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
    >
      {{ $t("checkout.payment") }}
    </section>

    <section id="confirmation" class="min-h-[70vh] border border-dashed py-20">
      {{ $t("checkout.confirmation") }}
    </section>
  </article>
</template>

<script>
// --- external
import { defineComponent, ref, computed } from "vue";

// -- components
import {
  UpmSession,
  useBasket,
  UpwIcon,
  UpwAvatar,
  useScrollSpy,
  UpwSteps,
  UpwButton,
} from "@upmind/client-vue";

// -- utils
import { vIntersectionObserver } from "@vueuse/components";
import { getLocalMessages } from "@/utils";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Checkout",
  i18n: { messages: getLocalMessages("checkout") },
  components: { UpwSteps, UpmSession, UpwIcon, UpwAvatar, UpwButton },
  directives: { "intersection-observer": vIntersectionObserver },
  setup() {
    const { items, meta } = useBasket();
    const { isScrolling, scrollIntoView } = useScrollSpy();
    return {
      items,
      meta,
      activeSection: ref(null),
      isScrolling,
      scrollIntoView,
      steps: computed(() => {
        return [
          {
            label: "Overview",
            hash: "#overview",
            complete: meta.value.hasProducts && meta.value.hasFields,
          },
          {
            label: "Account",
            hash: "#account",
            complete: meta.value.hasAccount,
          },
          {
            label: "Payment",
            hash: "#payment",
            complete:
              meta.value.hasBillingDetails && meta.value.hasPaymentDetails,
          },
          // { label: "Confirmation", hash: "#confirmation", disabled: true },
        ];
      }),
    };
  },
  watch: {
    meta: "scrollTo",
  },
  mounted() {
    this.scrollTo();
  },

  methods: {
    scrollSpy([section]) {
      if (!this.activeSection || this.isScrolling) return; // safety check to prevent multiple scrolls

      // if we have manually scrolled to a section, update the active section
      if (section.isIntersecting && section.target?.id) {
        this.activeSection = section.target.id;
      }
    },

    scrollTo() {
      if (this.isScrolling) return; // safety check to prevent multiple scrolls

      // scroll to the appropriate step when the basket has loaded
      // but only if the route has no hash, ie user has not navigated to a specific step

      if (!this.$route?.hash && !this.meta.isLoading) {
        if (!this.meta.hasProducts || !this.meta.hasFields) {
          this.activeSection = "overview";
        } else if (!this.meta.hasAccount) {
          this.activeSection = "account";
        } else {
          this.activeSection = "payment";
        }
        // ---
        this.isScrolling = true;
        this.scrollIntoView(this.activeSection, 108);
        // this.$router.push({ hash: `#${this.activeSection}` });
      } else {
        this.activeSection = this.$route.hash;
      }
    },

    doCheckout: async () => {
      checkout();
      await nextTick();

      const yOffset = -108;
      const y =
        paymentProcess.value?.getBoundingClientRect().top +
        window.scrollY +
        yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
    },
  },
});
</script>
