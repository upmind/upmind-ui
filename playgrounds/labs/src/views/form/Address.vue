<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    title="Address Renderer"
    subtitle="Search for addresses using the Places API"
  >
    <Card class="space-y-8">
      <UpmForm
        :schema="schema"
        :uischema="uischema"
        :model-value="modelValue"
        :additional-renderers="formRenderers"
        no-actions
        as="fieldset"
      />
    </Card>
  </UpmContentSection>
</template>

<script setup lang="ts">
import {
  UpmContentSection,
  UpmForm,
  formRenderers
} from "@upmind-automation/client-vue";
import { Card } from "@upmind-automation/upmind-ui";
import { ref } from "vue";

const modelValue = ref({});

const schema = {
  type: "object",
  properties: {
    address: {
      type: "string",
      title: "Address",
      format: "address"
    },
    address1: {
      type: "string",
      title: "Address Line 1"
    },

    address2: {
      type: ["string", "null"],
      title: "Address Line 2"
    },

    city: {
      type: "string",
      title: "City"
    },

    postcode: {
      type: "string",
      title: "Postcode"
    }
  }
};

const uischema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/address",
      options: {
        autoFocus: true,
        autocomplete: "off",
        placeholder: "Search for an address..."
      }
    },
    {
      type: "Control",
      scope: "#/properties/address1"
    },
    {
      type: "Control",
      scope: "#/properties/address2"
    },
    {
      type: "Control",
      scope: "#/properties/city"
    },
    {
      type: "Control",
      scope: "#/properties/postcode"
    }
  ]
};
</script>
