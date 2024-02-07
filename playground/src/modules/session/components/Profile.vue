<template>
  <div class="profile">
    <aside
      class="card sm:card-side bg-base-100 border rounded-btn"
      v-if="meta.isClient && !meta.isProcessing"
    >
      <figure class="relative m-0 sm:w-1/2 md:w-36 aspect-square">
        <img
          v-if="user.image_url"
          :src="user.image_url"
          alt="uploaded image thumbnail "
          class="aspect-square w-full h-full"
        />
      </figure>
      <div class="card-body py-2 px-4">
        <div class="">
          <span class="text-sm font-light italic"
            >You're currently logged in as</span
          >
          <h4 class="mt-2 mb-0">{{ user.fullname }}</h4>
          <h5 class="m-0 text-sm italic">{{ user.email }}</h5>
        </div>
        <div class="card-actions justify-end mt-auto">
          <router-link to="/" class="btn btn-ghost btn-sm">
            <user-circle-icon class="w-6 h-6" />
            My Account
          </router-link>

          <button class="btn btn-ghost btn-sm" @click.prevent="logout">
            <arrow-right-on-rectangle-icon class="w-6 h-6" />
            Logout
          </button>
        </div>
      </div>
    </aside>

    <upm-debug
      v-if="debugging"
      title="Session"
      :state="{ session: state }"
      :context="context"
      :errors="errors"
      :meta="meta"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { UpmDebug, useSession, UpmFormGenerator } from "@upmind/vue";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/vue/24/solid";

export default defineComponent({
  name: "Profile",
  components: {
    UpmFormGenerator,
    UpmDebug,
    UserCircleIcon,
    ArrowRightOnRectangleIcon
  },
  inheritAttrs: true,
  customOptions: {},
  emits: [],
  props: {
    debugging: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const session = useSession();
    return session;
  },
  computed: {},
  methods: {}
});
</script>
