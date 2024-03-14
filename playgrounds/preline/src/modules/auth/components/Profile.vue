<template>
  <aside
    class="card sm:card-side rounded-btn border bg-base-100"
    v-if="meta.isClient && !meta.isProcessing"
  >
    <figure class="relative m-0 aspect-square sm:w-1/2 md:w-36">
      <img
        v-if="user.image_url"
        :src="user.image_url"
        alt="uploaded image thumbnail "
        class="aspect-square h-full w-full"
      />
    </figure>
    <div class="card-body px-4 py-2">
      <div class="">
        <span class="text-sm font-light italic"
          >You're currently logged in as</span
        >
        <h4 class="mb-0 mt-2">{{ user.fullname }}</h4>
        <h5 class="m-0 text-sm italic">{{ user.email }}</h5>
      </div>
      <div class="card-actions mt-auto justify-end">
        <router-link to="/" class="btn btn-ghost btn-sm">
          <user-circle-icon class="h-6 w-6" />
          My Account
        </router-link>

        <button class="btn btn-ghost btn-sm" @click.prevent="logout">
          <arrow-right-on-rectangle-icon class="h-6 w-6" />
          Logout
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
