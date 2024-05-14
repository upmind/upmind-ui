<template>
  <upm-client-details class="my-4" />
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";
import { UpmClientDetails } from "@upmind/client";

export default defineComponent({
  name: "ClientDetails",
  i18n: {
    messages: getLocalMessages("client"),
  },
  components: {
    UpmClientDetails,
  },
});
</script>
