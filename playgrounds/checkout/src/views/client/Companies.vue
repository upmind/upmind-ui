<template>
  <UpmClientListings type="companies" i18nKey="companies" class="my-4" cols="2">
    <template #header="{ meta }">
      <h2>
        {{
          meta.isAvailable
            ? t("client.companies.title")
            : t("client.unavailable")
        }}
      </h2>
    </template>
  </UpmClientListings>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmClientListings } from "@upmind-automation/client-vue";

const { t } = useI18n();
</script>
