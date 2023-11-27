<template>
  <ul
    role="list"
    class="divide-lm-contrast/10 dark:divide-dm-contrast/10 mt-6 divide-y"
  >
    <li
      v-for="{ item } in modelValue"
      :key="item.domain"
      class="group items-center gap-x-4 gap-y-1 px-4 py-4 transition-colors sm:flex sm:flex-wrap sm:pl-6"
      :class="{
        'dark:hover:bg-dm-contrast/5 hover:bg-lm-contrast/2': item.is_available
      }"
    >
      <slot name="item" v-bind="{ item }"> <UpmResult :result="item" /></slot>
    </li>
  </ul>
</template>

<script lang="ts">
import UpmResult from "./ResultAddToBasket.vue";
import { CheckCircleIcon } from "@heroicons/vue/24/outline";

export default defineComponent({
  name: "UpmRequest",
  components: {
    UpmResult,
    CheckCircleIcon
  },
  props: {
    modelValue: {
      type: Array,
      required: true,
      default: () => ({})
    }
  }
});
</script>
