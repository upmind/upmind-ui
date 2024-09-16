<template>
  <div class="auth">
    <div v-if="!meta.isAuthenticated">
      <div class="stats w-full border">
        <div
          class="stat indicator bg-primary bg-opacity-10"
          @click.prevent="showRegister"
        >
          <span
            v-if="meta.showRegisterForm"
            class="indicator-item m-4 aspect-square rounded-full bg-primary p-1 text-primary-content"
          >
            <check-icon class="h-5 w-5" />
          </span>

          <div class="stat-figure flex text-primary">
            <plus-icon class="-mr-4 h-8 w-8" />
            <user-icon class="h-16 w-16" />
          </div>
          <div class="stat-value whitespace-normal text-xl text-primary">
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
          class="stat indicator bg-secondary bg-opacity-10"
          @click.prevent="showLogin"
        >
          <span
            v-if="meta.showLoginForm"
            class="indicator-item m-4 aspect-square rounded-full bg-secondary p-1 text-secondary-content"
          >
            <check-icon class="h-5 w-5" />
          </span>

          <div class="stat-figure flex text-secondary">
            <check-icon class="-mr-4 h-8 w-8" />
            <user-icon class="h-16 w-16" />
          </div>
          <div class="stat-value whitespace-normal text-xl text-secondary">
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

    <upw-form
      :loading="meta.isFormLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="errors?.data"
      @reject="reject"
      @resolve="resolve"
      class="my-8 gap-8 bg-opacity-10 p-4"
      :class="{
        'bg-primary': meta.showRegisterForm,
        'bg-secondary': meta.showLoginForm,
      }"
      v-if="meta.showLoginForm || meta.show2fa || meta.showRegisterForm"
    >
      <template #actions="{ meta: formMeta }">
        <button
          class="btn"
          :class="[
            { 'btn-primary': meta.showRegisterForm },
            { 'btn-secondary': meta.showLoginForm },
          ]"
          type="submit"
          :disabled="!formMeta.isValid || formMeta.isProcessing"
        >
          <span v-if="meta.showLoginForm">{{ $t("auth.actions.login") }}</span>
          <span v-else-if="meta.showRegisterForm">{{
            $t("auth.actions.register")
          }}</span>
          <span v-else>{{ $t("auth.actions.continue") }}</span>
        </button>
      </template>
    </upw-form>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useSession } from "@upmind/flow-vue";

export default defineComponent({
  name: "Auth",
  components: { UpwForm, UserIcon, PlusIcon, CheckIcon },
  inheritAttrs: false,

  emits: [],
  props: {},
  setup() {
    return useSession();
  },
  computed: {},
  methods: {},
});
</script>
