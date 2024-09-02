<template>
  <div class="flex items-center justify-center py-6 sm:justify-between sm:py-8">
    <img class="m-0 h-5" src="../../assets/logo-white.svg" alt="logo" />

    <div class="hidden space-x-12 text-sm sm:flex">
      <a
        v-for="(item, index) in menuItems"
        :key="index"
        class="flex cursor-pointer items-center text-white no-underline opacity-80 transition-all duration-300 hover:opacity-100"
        :href="item.href"
        target="_blank"
      >
        <img
          v-if="item.icon === 'phone'"
          class="my-0"
          src="../../assets/icons/phone.svg"
          style="margin-right: 5px; height: 16px"
        />
        <img
          v-if="item.icon === 'envelope'"
          class="my-0 h-4"
          src="../../assets/icons/envelope.svg"
          style="margin-right: 6px; height: 16px"
        />
        <img
          v-if="item.icon === 'lock'"
          class="my-0 h-3"
          src="../../assets/icons/lock.svg"
          style="margin-right: 5px; height: 14px"
        />
        <div>{{ item.label }}</div>
      </a>
    </div>
  </div>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

export default defineComponent({
  setup() {
    const menuItems = ref([
      { label: "Contact", icon: "phone", href: "tel:+0000000000000" },
      {
        label: "sales@velia.net",
        icon: "envelope",
        href: "mailto:sales@velia.net",
      },
      {
        label: "Client Login",
        icon: "lock",
        href: "https://login.velia.net/velia/login",
      },
    ]);
    return { menuItems };
  },
});
</script>
