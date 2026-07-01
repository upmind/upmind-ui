<template>
  <UpmSection :label="t('text.personal_details')">
    <i18n-t keypath="text.personal_details_msg" tag="h1" />
    <div v-for="profileField in data" :key="profileField.id">
      <div class="flex">
        <div class="grow">
          <p>{{ profileField.title }}</p>
          <p>Value: {{ profileField.value }}</p>
        </div>
        <div v-if="!profileField.meta?.isDisabled">
          <Link
            :label="t('action.edit')"
            size="sm"
            color="muted"
            tabindex="-1"
            class="pointer-events-auto ml-2 h-4"
            :to="{
              name: editRoute,
              query: {
                fields: `${profileField.meta.isCustomField ? 'customFields.' : ''}${profileField.code}`
              }
            }"
          />
        </div>
      </div>
    </div>
  </UpmSection>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmSection } from "@upmind-automation/client-vue";
import { usePersonalDetails } from "@upmind-automation/headless";
import { Link } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const _props = withDefaults(
  defineProps<{
    editRoute?: string;
  }>(),
  {
    editRoute: "account.profile.edit"
  }
);

const { t } = useI18n();

const { data, isReady } = usePersonalDetails();

await isReady();
</script>
