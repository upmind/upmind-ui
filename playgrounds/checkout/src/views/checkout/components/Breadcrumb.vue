<template>
  <nav
    class="sticky top-0 z-10 -mx-4 -mt-8 flex flex-row items-center justify-start gap-8 border-b border-base-300 bg-base px-4 text-base-content sm:-mx-6 sm:px-6 lg:-mx-20 lg:px-20"
  >
    <template v-for="(step, index) in steps" :key="step.hash">
      <component
        :is="step.disabled ? 'button' : 'router-link'"
        :to="step.disabled ? null : { hash: step.hash }"
        :disabled="step.disabled"
        class="m-0 flex items-center gap-3 border-b-2 border-transparent py-8 font-light leading-none no-underline transition disabled:pointer-events-none disabled:opacity-50"
        :class="[
          {
            'font-medium': step.hash == $route?.hash || step.complete,
            'text-primary': step.complete,
            '!border-primary': step.hash == $route?.hash,
          },
        ]"
      >
        <upw-avatar
          v-if="step.complete"
          avatar="check-circle"
          size="xs"
          class="bg-primary-content"
        />

        <upw-avatar
          v-else
          :avatar="{
            caption: `${index + 1}`,
          }"
          size="xs"
          :class="
            step.hash == $route?.hash ? 'bg-primary text-primary-content' : ''
          "
        />

        <span>{{ step.label }}</span>
      </component>
    </template>
  </nav>
</template>

<script>
// --- external
import { defineComponent, computed } from "vue";

// -- components
import { useBasket, UpwAvatar } from "@upmind/client-vue";
const { meta, checkout } = useBasket();

export default defineComponent({
  components: { UpwAvatar },
  props: {},
  setup() {
    return {
      meta,
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
    };
  },
});
</script>
