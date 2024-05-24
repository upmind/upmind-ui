<template>
  <article class="flex flex-col">
    <upw-steps
      :model-value="activeSection"
      :steps="steps"
      :loading="meta.isLoading"
      @update:model-value="isScrolling = true"
    >
      <template #append>
        <div class="ml-auto w-full max-w-sm text-right">
          <upw-button
            :disabled="!meta.isReadyForCheckout || meta.isProcessing"
            @click.prevent="doCheckout"
            color="primary"
            class="ml-auto"
          >
            {{ $t("basket.summary.actions.submit") }}
          </upw-button>
        </div>
      </template>
    </upw-steps>

    <!-- overview -->
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

    <!-- account -->
    <section
      id="account"
      :class="styles.checkout.section.root"
      v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
    >
      <upm-session />
    </section>

    <!-- payment -->
    <section
      id="payment"
      :class="
        mergeStyles(
          styles.checkout.payment.root,
          !meta.hasProducts || !meta.hasAccount
            ? styles.checkout.section.disabled
            : {}
        )
      "
      class="justify-between"
      v-intersection-observer="[scrollSpy, { threshold: 0.1 }]"
      :disabled="!meta.hasProducts || !meta.hasAccount"
    >
      <header :class="styles.checkout.payment.header">
        <span :class="styles.checkout.section.text">
          {{ $t("basket.payment.text") }}
        </span>

        <h1 :class="styles.checkout.section.title">
          {{ $t("basket.payment.title", { total: "$0.00" }) }}
        </h1>
      </header>

      <upm-basket-summary :class="styles.checkout.payment.summary" no-actions />

      <div :class="styles.checkout.payment.content">
        <!-- <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /> -->
      </div>

      <!-- <footer :class="styles.checkout.section.footer">
        <slot name="footer" v-bind="{ meta }"></slot>
      </footer> -->
    </section>

    <!-- confirmation -->
    <section
      v-if="meta.isComplete"
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
import { useStyles, mergeStyles } from "@upmind/upwind";
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

    const styles = useStyles(
      ["checkout", "checkout.section", "checkout.payment"],
      meta,
      config
    );

    return {
      mergeStyles,
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
            disabled: !meta.value.hasProducts || !meta.value.hasAccount,
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
