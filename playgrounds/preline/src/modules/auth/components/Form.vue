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
          class="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-transparent px-4 py-3 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
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
  props: {},
  setup() {
    return useSession();
  },
  computed: {},
  methods: {},
});
</script>
