<template>
  <article :class="styles.checkout.root">
    <upw-steps
      :model-value="activeSection"
      :steps="steps"
      :loading="meta.isLoading"
      @update:model-value="scrollTo"
    >
      <template #append>
        <div class="ml-auto w-full max-w-xs text-right">
          <upw-button
            :disabled="!meta.isReadyForCheckout || meta.isProcessing"
            @click.prevent="doCheckout"
            color="primary"
            class="ml-auto"
            :label="$t('basket.summary.actions.submit')"
            block
          />
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
      TODO: Overview Section

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
    <upm-session
      id="account"
      :class="styles.checkout.section.root"
      v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
    />

    <!-- payment -->
    <upm-basket-details
      id="payment"
      :class="styles.checkout.section.root"
      v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
    />

    <!-- confirmation -->
    <upm-basket-confirmation
      id="confirmation"
      :class="styles.checkout.section.root"
      v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
    />

    <!-- empty -->
    <upm-basket-empty id="empty" :class="styles.checkout.section.root" />

    <!-- order -->
    <section
      v-if="meta.isComplete"
      id="order"
      :class="[styles.checkout.section.root, styles.checkout.section.centered]"
      class="border border-dashed bg-base-100"
    >
      TODO: Order Section
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
  UpmBasketDetails,
  UpmBasketConfirmation,
  UpmBasketEmpty,
  // ---
  UpwIcon,
  UpwAvatar,
  UpwSteps,
  UpwButton,
} from "@upmind/client-vue";

// -- utils
import { vIntersectionObserver } from "@vueuse/components";
import { getLocalMessages } from "@/utils";
import { trimStart } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Checkout",
  i18n: { messages: getLocalMessages("checkout") },
  components: {
    UpmSession,
    UpmBasketDetails,
    UpmBasketConfirmation,
    UpmBasketEmpty,
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
            disabled: !meta.value.isAvailable,
          },
          {
            label: "Account",
            hash: "#account",
            complete: meta.value.hasAccount,
            disabled: !meta.value.isAvailable,
          },
          {
            label: "Payment",
            hash: "#payment",
            disabled: !meta.value.hasProducts || !meta.value.hasAccount,
            complete:
              meta.value.hasBillingDetails && meta.value.hasPaymentDetails,
          },
          {
            label: "Confirmation",
            hash: "#confirmation",
            disabled:
              !meta.isCheckout ||
              !meta.isConverting ||
              !meta.isPaying ||
              !meta.isComplete,
            complete: meta.isComplete,
          },
        ];
      }),
    };
  },
  watch: {
    meta() {
      this.scrollTo();
    },
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

    scrollTo(hash) {
      if (this.meta.isLoading || this.meta.isProcessing || this.isScrolling)
        return;

      const current = this.activeSection;
      // fallback to the route hash if set
      let target = trimStart(hash, "#");

      // scroll to the appropriate step when the basket has loaded
      // but only if we dont already have no target, ie user has not navigated to a specific step
      // and only if weve never had a target before, ie on first load
      if (!target && !current) {
        // only do this section if weve not scrolled to a section yet
        if (!this.meta.hasProducts) {
          target = "overview";
        } else if (!this.meta.hasAccount) {
          target = "account";
        } else {
          target = "payment";
        }
      }

      if (target && target != current) {
        this.activeSection = target;
        this.scrollIntoView(this.activeSection, 108);
      }
    },

    doCheckout: async () => {
      // TODO: implement the checkout progress modal
      this.checkout();
    },
  },
});
</script>
