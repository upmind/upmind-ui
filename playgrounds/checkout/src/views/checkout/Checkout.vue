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
          {{ $t("basket.summary.actions.submit") }}
        </upw-button>
      </template>
    </upw-steps>

    <!-- <pre>{{ meta }}</pre> -->

    <section
      id="overview"
      :class="[styles.checkout.section.root, styles.checkout.section.centered]"
      class="border border-dashed bg-base-100"
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
      :class="styles.checkout.section.root"
      v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
    >
      <upm-session />
    </section>

    <section
      id="payment"
      :class="[styles.checkout.section.root]"
      class="justify-between border border-dashed bg-base-100"
      v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
    >
      <!-- <header :class="styles.checkout.section.header">
        <slot name="header" v-bind="{ meta }"></slot>
      </header> -->

      <div :class="styles.checkout.section.content" class="max-w-xl flex-1">
        {{ $t("checkout.payment") }}

        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br />
      </div>

      <upm-basket-summary :class="styles.checkout.summary" />

      <!-- <footer :class="styles.checkout.section.footer">
        <slot name="footer" v-bind="{ meta }"></slot>
      </footer> -->
    </section>

    <section
      id="confirmation"
      :class="[styles.checkout.section.root, styles.checkout.section.centered]"
      class="border border-dashed bg-base-100"
    >
      {{ $t("checkout.confirmation") }}
    </section>
  </article>
</template>

<script>
// --- external
import { defineComponent, ref, computed } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// -- components
import {
  useScrollSpy,
  useBasket,
  // ---
  UpmSession,
  UpmBasketSummary,
  // ---
  UpwIcon,
  UpwAvatar,
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
  components: {
    UpmSession,
    UpmBasketSummary,
    // ---
    UpwSteps,
    UpwIcon,
    UpwAvatar,
    UpwButton,
  },
  directives: { "intersection-observer": vIntersectionObserver },
  setup() {
    const { items, meta } = useBasket();
    const { isScrolling, scrollIntoView } = useScrollSpy();

    const styles = useStyles(["checkout", "checkout.section"], meta, config);

    return {
      styles,
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
    meta: "scrollTo", // if we have new data, scroll to the appropriate section
  },
  mounted() {
    this.scrollTo(); // scroll to the appropriate section when the component is mounted
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
