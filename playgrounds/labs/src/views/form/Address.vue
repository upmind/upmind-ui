<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    title="Address Renderer"
    subtitle="Search for addresses using the Places API"
  >
    <UpmCard class="space-y-8">
      <UpmForm
        :schema="fields"
        :ui-schema="uischema"
        :model-value="modelValue"
        :additional-renderers="formRenderers"
        no-actions
        as="fieldset"
      />
    </UpmCard>
  </UpmContentSection>
</template>

<script setup lang="ts">
import {
  UpmContentSection,
  UpmCard,
  UpmForm,
  formRenderers,
} from "@upmind-automation/client-vue";
import { ref } from "vue";

const modelValue = ref({});

const fields = {
  type: "object",
  properties: {
    address: {
      type: "string",
      title: "Address Input",
      format: "address",
    },
  },
};

const uischema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/address",
      options: {},
    },
  ],
};
</script>
