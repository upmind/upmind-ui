<template>
  <section class="client w-full">
    <header class="flex w-full flex-wrap">
      <h2 class="m-0 text-nowrap">
        {{ $t("client.phones.title") }}
      </h2>
    </header>

    <upm-client-phones class="my-4" />
  </section>
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";
import { UpmClientPhones } from "@upmind/client";

export default defineComponent({
  name: "ClientPhones",
  i18n: {
    messages: getLocalMessages("client"),
  },
  components: {
    UpmClientPhones,
  },
});
</script>
