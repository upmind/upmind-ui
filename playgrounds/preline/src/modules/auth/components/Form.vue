<template>
  <div class="auth">
    <div v-if="!meta.isAuthenticated">
      <!-- <button @click="getUser" v-if="meta.isAuthenticated">get user</button> -->
      <button
        class="btn btn-ghost join-item"
        type="reset"
        @click.prevent="logout"
        v-if="meta.isAuthenticated"
      >
        logout
      </button>
    </div>

    <upm-form-generator
      :key="meta.showLoginForm ? 'login' : 'register'"
      v-bind="$attrs"
      :loading="meta.isFormLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="errors?.data"
      @reject="reject"
      @resolve="resolve"
      v-if="meta.showLoginForm || meta.show2fa || meta.showRegisterForm"
    >
      <template #actions="{ meta: formMeta }">
        <button
          class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
          :class="[
            {
              'bg-primary text-primary-content hover:bg-primary-700 ':
                meta.showRegisterForm,
              'bg-secondary text-secondary-content hover:bg-secondary-700 ':
                meta.showLoginForm,
            },
          ]"
          type="submit"
          :disabled="!formMeta.isValid || formMeta.isProcessing"
        >
          <span v-if="meta.showLoginForm">Sign in</span>
          <span v-else-if="meta.showRegisterForm">Create my account</span>
          <span v-else>Continue</span>
        </button>
      </template>
    </upm-form-generator>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useSession } from "@upmind/vue";

import UpmFormGenerator from "@/components/FormGenerator.vue";

export default defineComponent({
  name: "AuthForm",
  components: { UpmFormGenerator },
  inheritAttrs: false,
  customOptions: {},
  emits: [],
  props: {
    debugging: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    return useSession();
  },
  computed: {},
  methods: {},
});
</script>
