<template>
  <upm-client-listings type="phones" class="my-4">
    <template #header="{ meta }">
      <h2>
        {{
          meta.isAvailable
            ? $t("client.phones.title")
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
  name: "ClientPhones",
  i18n: {
    messages: getLocalMessages("client"),
  },
  components: {
    UpmClientListings,
  },
});
</script>
