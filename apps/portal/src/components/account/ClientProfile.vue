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
            @click.stop.prevent="
              router.push({
                name: ROUTE.ACCOUNT_PROFILE_EDIT,
                query: { fields: `${profileField.code}` }
              })
            "
          />
        </div>
      </div>
    </div>
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

// --- internal
import { useProfileDetails } from "@upmind-automation/headless";
import { ROUTE } from "../../router/types";

// --- components
import { UpmSection } from "@upmind-automation/client-vue";
import { Link } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const router = useRouter();

const { data, isReady, meta, customFields } = useProfileDetails();

await isReady();
</script>
