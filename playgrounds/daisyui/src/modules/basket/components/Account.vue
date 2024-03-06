<template>
  <div
    tabindex="0"
    ref="form"
    class="card card-bordered card-compact bg-base-100"
    :class="[
      !modelValue ? 'border-primary' : '',
      modelValue ? 'border-warning' : '',
    ]"
  >
    <div class="card-body">
      <h3 class="text-inherit uppercase text-xl mt-2 mb-0 opacity-50">
        Account
      </h3>

      <upm-auth class="mt-4 p-0" v-if="modelValue"></upm-auth>

      <upm-profile class="mt-4 p-0 border-none" v-else></upm-profile>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UpmAuth from "../../session/components/Auth.vue";
import UpmProfile from "../../session/components/Profile.vue";

export default defineComponent({
  name: "UpmBasketCurrency",
  components: { UpmAuth, UpmProfile },
  inheritAttrs: true,
  customOptions: {},
  props: {
    modelValue: {
      type: Boolean, // xstate actor
      required: true,
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props) {},

  computed: {},

  methods: {},
});
</script>
