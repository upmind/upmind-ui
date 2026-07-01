<template>
  <UpmLayout :variant="layout">
    <template #actions></template>

    <template #content-header>
      <h1>
        <i18n-t keypath="text.profile" tag="span" scope="global" />
      </h1>
    </template>

    <template #default>
      <ClientProfileFieldsEdit
        :fields="props.fields"
        profile-route="admin.account.profile"
      />
    </template>

    <template #aside>
      <!-- <pre>{{ { meta, currentRoute } }}</pre> -->
    </template>
  </UpmLayout>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { UpmLayout, LAYOUT_VARIANTS } from "@upmind-automation/client-vue";
import ClientProfileFieldsEdit from "../components/ClientProfileFieldsEdit.vue";

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{ fields: string[] }>();

// -----------------------------------------------------------------------------

const route = useRoute();

const layout = computed((): LAYOUT_VARIANTS => {
  return (route?.meta?.template as LAYOUT_VARIANTS) ?? LAYOUT_VARIANTS.FULL;
});
</script>
