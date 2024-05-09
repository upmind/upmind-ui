<template>
  <upm-client-listings type="addresses" class="my-4">
    <template #header="{ meta }">
      <h2>
        {{
          meta.isAvailable
            ? $t("client.addresses.title")
            : $t("client.unavailable")
        }}
      </h2>
    </template>
  </upm-client-listings>
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";
import { UpmClientListings } from "@upmind/client";

export default defineComponent({
  name: "ClientAddresses",
  i18n: {
    messages: getLocalMessages("client"),
  },
  components: {
    UpmClientListings,
  },
});
</script>
