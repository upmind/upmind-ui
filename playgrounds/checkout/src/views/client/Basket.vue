<template>
  <Upm-Billing-Details class="my-4" />
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";
import { UpmBillingDetails } from "@upmind/client-vue";

export default defineComponent({
  name: "ClientBasket",
  i18n: {
    messages: getLocalMessages("client"),
  },
  components: {
    UpmBillingDetails,
  },
});
</script>
