<template>
  <suspense>
    <article class="flex flex-col gap-4">
      <pre>{{ messages?.checkout }}</pre>

      <section class="h-20 border border-dashed">
        {{ messages?.checkout?.breadcrumb }}
      </section>
      <section class="min-h-screen border border-dashed">
        {{ messages?.checkout?.overview }}
      </section>
      <section class="min-h-screen border border-dashed">
        {{ messages?.checkout?.account }}
      </section>
      <section class="min-h-screen border border-dashed">
        {{ messages?.checkout?.payment }}
      </section>
      <section class="min-h-screen border border-dashed">
        {{ messages?.checkout?.confirmation }}
      </section>
    </article>
  </suspense>
</template>

<script setup>
import { inject, ref } from "vue";

const i18n = inject("i18n");
const messages = ref({});

i18n.getLocale("/views/checkout").then(messages => {
  messages.value = messages;
});
</script>
