<template>
  <section class="client w-full">
    <header class="flex w-full flex-wrap">
      <h2 class="m-0 text-nowrap">
        {{ $t("client.emails.title") }}
      </h2>
    </header>

    <upm-client-emails class="my-4" />
  </section>
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";
import { UpmClientEmails } from "@upmind/client";

export default defineComponent({
  name: "ClientEmails",
  i18n: {
    messages: getLocalMessages("client"),
  },
  components: {
    UpmClientEmails,
  },
});
</script>
