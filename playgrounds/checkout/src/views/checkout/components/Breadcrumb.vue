<template>
  <nav
    class="sticky top-0 z-10 -mx-4 -mt-8 flex flex-row items-center justify-start gap-8 border-b border-base-300 bg-base px-4 text-base-content sm:-mx-6 sm:px-6 lg:-mx-20 lg:px-20"
  >
    <router-link
      v-for="(step, index) in steps"
      :key="step.hash"
      custom
      v-slot="{ isActive, href, navigate }"
      :to="{ hash: step.hash }"
    >
      <component
        :is="step.disabled ? 'span' : 'a'"
        @click="!step.disabled && navigate"
        :href="href"
        :disabled="step.disabled"
        class="m-0 flex items-center gap-3 border-b-2 border-transparent p-0 py-8 font-light leading-none no-underline transition"
        :class="[
          {
            'text-primary': step.hash == $route?.hash,
            '!border-primary': step.hash == $route?.hash,
          },
        ]"
      >
        <upw-avatar
          :avatar="{ caption: `${index + 1}` }"
          size="xs"
          :class="
            step.hash == $route?.hash
              ? 'bg-primary text-primary-content transition'
              : ''
          "
        ></upw-avatar>

        <span>{{ step.label }}</span>
      </component>
    </router-link>
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
          { label: "Overview", hash: "#overview" },
          { label: "Account", hash: "#account" },
          { label: "Payment", hash: "#payment" },
          { label: "Confirmation", hash: "#confirmation", disabled: true },
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
