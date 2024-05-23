<template>
  <upm-client-listings type="emails" i18nKey="emails" class="my-4" cols="2">
    <template #header="{ meta }">
      <h2>
        {{
          meta.isAvailable
            ? $t("client.emails.title")
            : $t("client.unavailable")
        }}
      </h2>
    </template>
  </upm-client-listings>
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";
import { UpmClientListings } from "@upmind/client-vue";

export default defineComponent({
  name: "ClientEmails",
  i18n: {
    messages: getLocalMessages("client"),
  },
  components: {
    UpmClientListings,
  },
});
</script>
