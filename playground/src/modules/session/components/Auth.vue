<template>
  <div>
    <div v-if="!meta.isAuthenticated">
      <div class="stats shadow-md border w-full overflow-visible">
        <div
          class="stat bg-primary bg-opacity-5 indicator"
          @click.prevent="showRegister"
        >
          <span
            v-if="meta.showRegisterForm"
            class="indicator-item bg-primary text-primary-content aspect-square rounded-full p-1"
          >
            <check-icon class="w-5 h-5" />
          </span>

          <div class="stat-figure text-primary flex self-start">
            <plus-icon class="w-8 h-8 -mr-4" />
            <user-icon class="w-16 h-16" />
          </div>
          <div class="stat-value text-xl text-primary whitespace-normal">
            New Customer
          </div>
          <div class="stat-title max-w-sm whitespace-normal">
            Create an account for faster checkout and access your orders.
          </div>
          <div class="stat-actions">
            <button class="btn btn-sm btn-primary">Register</button>
          </div>
        </div>

        <div
          class="stat bg-secondary bg-opacity-5 indicator"
          @click.prevent="showLogin"
        >
          <span
            v-if="meta.showLoginForm"
            class="indicator-item bg-secondary text-secondary-content aspect-square rounded-full p-1"
          >
            <check-icon class="w-5 h-5" />
          </span>

          <div class="stat-figure text-secondary flex self-start">
            <check-icon class="w-8 h-8 -mr-4" />
            <user-icon class="w-16 h-16" />
          </div>
          <div class="stat-value text-xl text-secondary whitespace-normal">
            Existing Customer
          </div>
          <div class="stat-title max-w-sm whitespace-normal">
            Login to your account for a faster checkout and shopping experience.
          </div>
          <div class="stat-actions">
            <button class="btn btn-sm btn-secondary">Login</button>
          </div>
        </div>
      </div>

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

    <div
      class="card card-bordered my-8"
      v-if="meta.showLoginForm || meta.show2fa || meta.showRegisterForm"
    >
      <div class="card-body">
        <upm-form-generator
          :loading="meta.isFormLoading"
          :processing="meta.isProcessing"
          :model-value="model"
          :schema="schema"
          :uischema="uischema"
          :additional-errors="errors?.data"
          @reject="reject"
          @resolve="resolve"
        >
          <template #actions="{ meta: formMeta, doReject }">
            <button
              class="btn"
              :class="[
                { 'btn-primary': meta.showRegisterForm },
                { 'btn-secondary': meta.showLoginForm }
              ]"
              type="submit"
              :disabled="!formMeta.isValid || formMeta.isProcessing"
            >
              <span v-if="meta.showLoginForm">Log into my account</span>
              <span v-else-if="meta.showRegisterForm">Create my account</span>
              <span v-else>Continue</span>
            </button>
          </template>
        </upm-form-generator>
      </div>
    </div>

    <upm-debug
      v-if="debugging"
      title="Session"
      :state="{ session: state, guest: guest?.value, client: client?.value }"
      :context="context"
      :errors="errors"
      :meta="meta"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import { useSession } from "../";
import { UpmDebug } from "@upmind/components";
import { UpmFormGenerator } from "@upmind/components";
import type { ErrorObject } from "ajv";
import { UserIcon, PlusIcon, CheckIcon } from "@heroicons/vue/24/outline";

export default defineComponent({
  name: "Auth",
  components: { UpmFormGenerator, UpmDebug, UserIcon, PlusIcon, CheckIcon },
  inheritAttrs: true,
  customOptions: {},
  emits: [],
  props: {
    debugging: {
      type: Boolean,
      default: false
    },
    processing: {
      type: Boolean,
      default: false
    },

    additionalErrors: {
      type: Array as PropType<
        ErrorObject<string, Record<string, any>, unknown>[]
      >,
      default: () => []
    }
  },
  setup(props) {
    return useSession();
  },
  computed: {},
  methods: {}
});
</script>
