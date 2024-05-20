<template>
  <upm-client-basket class="my-4" />
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";
import { UpmClientBasket } from "@upmind/client";

export default defineComponent({
  name: "ClientBasket",
  i18n: {
    messages: getLocalMessages("client"),
  },
  components: {
    UpmClientBasket,
  },
});
</script>
