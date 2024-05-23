<template>
  <article class="flex flex-col gap-4">
    <upm-session show="login" class="max-w-3xl">
      <template #footer="{ meta }">
        <template v-if="meta.showRegisterForm">
          <p class="m-0">
            This form is protected by reCAPTCHA and Google's 
            <a href="#"> Privacy policy</a> and 
            <a href="#">Terms of service</a> apply.
          </p>
          <p class="m-0">
            By clicking 'Create new account' I agree to Mochahost's <a href="#">
              Terms & Conditions.
            </a>
          </p>
        </template>
      </template>
    </upm-session>
  </article>
</template>

<script>
import { defineComponent } from "vue";
import { UpmSession } from "@upmind/client";
import { getLocalMessages } from "@/utils";

export default defineComponent({
  name: "Session",
  i18n: { messages: getLocalMessages("session") },
  components: { UpmSession },
});
</script>
