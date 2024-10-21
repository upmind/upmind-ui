<template>
  <article class="flex flex-col gap-4">
    <UpmSession show="register" class="max-w-3xl py-16">
      <template #footer="{ meta }">
        <template v-if="meta.showRegisterForm">
          <i18n-t keypath="auth.google_recaptcha_terms" tag="p" class="mb-0">
            <template #[`privacyPolicy`]>
              <a
                class=""
                href="https://policies.google.com/privacy"
                target="_blank"
              >
                {{ t("auth.privacy_policy") }}
              </a>
            </template>
            <template #[`termsOfService`]>
              <a
                class=""
                href="https://policies.google.com/terms"
                target="_blank"
              >
                {{ t("auth.terms_of_service") }}
              </a>
            </template>
          </i18n-t>

          <i18n-t keypath="auth.brand_terms" tag="p" class="m-0">
            <template #label
              ><i18n-t keypath="auth.actions.register"
            /></template>
            <template #brand>{{ brandName }}</template>
            <template #object
              ><i18n-t keypath="auth.terms_and_conditions"
            /></template>
          </i18n-t>
        </template>
      </template>
    </UpmSession>
  </article>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { UpmSession, useBrand } from "@upmind/client-vue";

const { context } = useBrand();
const brandName = computed(() => context.value.name);
</script>
