<template>
  <section class="client w-full">
    <header class="flex w-full flex-wrap">
      <h2 class="m-0 text-nowrap">
        {{ $t("client.companies.title") }}
      </h2>
    </header>

    <router-view />
  </section>
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";

export default defineComponent({
  name: "ClientCompanies",
  i18n: {
    messages: getLocalMessages("client"),
  },
});
</script>
