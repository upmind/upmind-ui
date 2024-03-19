<template>
  <aside
    v-if="meta.isAuthenticated"
    class="w-full rounded-xl border border-base-300 bg-base-50 p-4 text-base-content shadow-lg sm:p-7"
  >
    <div class="flex flex-col items-center py-10">
      <img
        class="mb-3 h-24 w-24 rounded-full shadow-lg"
        :src="user.image_url"
        alt="Bonnie image"
        v-if="user.image_url"
      />
      <h5 class="mb-1 text-xl font-medium text-base-900 dark:text-white">
        {{ user.fullname }}
      </h5>
      <span class="text-sm text-base-500 dark:text-base-400">{{
        user.email
      }}</span>
      <div class="mt-4 flex md:mt-6">
        <button
          @click.prevent="logout"
          class="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary dark:focus:ring-primary-800"
        >
          Sign out
        </button>
      </div>
    </div>
  </aside>
</template>

<script>
import { defineComponent } from "vue";
import { useSession } from "@upmind/vue";

import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/vue/24/solid";

export default defineComponent({
  name: "Profile",
  components: {
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
  },
  inheritAttrs: true,
  customOptions: {},
  emits: [],
  props: {},
  setup() {
    const session = useSession();
    return session;
  },
  computed: {},
  methods: {},
});
</script>
