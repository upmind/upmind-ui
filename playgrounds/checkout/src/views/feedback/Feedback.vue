<template>
  <section class="feedback w-full">
    <header class="flex flex-wrap items-center gap-2">
      <h2 class="title m-0 w-full text-wrap sm:flex-1">
        <span v-if="meta.isProcessing" class="text-primary">{{
          activeCount
        }}</span>

        Message{{ activeCount == 1 ? "" : "s" }}

        <span v-if="meta.isProcessing">
          {{ activeCount == 1 ? "is" : "are" }}
          <span class="text-primary">Active</span>
        </span>

        <span v-if="hasScheduled">
          , and
          <span v-if="meta.isProcessing" class="text-secondary">{{
            scheduledCount
          }}</span>
          {{ scheduledCount == 1 ? "is" : "are" }}
          <span class="text-secondary">Scheduled</span>
        </span>
      </h2>

      <upw-button
        variant="outlined"
        size="sm"
        @click="processMessages()"
        :disabled="meta.isProcessing"
        label="Add Mixed"
      />

      <upw-button
        variant="outlined"
        size="sm"
        @click="processMessages('toast')"
        :disabled="meta.isProcessing"
        label="Add Toasts"
      />

      <upw-button
        variant="outlined"
        size="sm"
        @click="processMessages('notification')"
        :disabled="meta.isProcessing"
        label="Add Banners"
      />
    </header>

    <div class="my-8 flex flex-col gap-4 text-base-foreground">
      <upm-message
        v-for="message in messages"
        :key="message.id"
        :item="message"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useFeedback, UpwButton } from "@upmind/client-vue";
import UpmMessage from "./MessageLog.vue";
import { useTimestamp } from "@vueuse/core";
import { forEach, random, nth, some, filter } from "lodash-es";
import { faker } from "@faker-js/faker";

const { state, messages, meta, useTime, add } = useFeedback();

// ---
const timestamp = useTimestamp();

const hasScheduled = computed(() =>
  some(
    messages.value,
    ({ state }) => state.value.context.scheduled > timestamp.value
  )
);

const activeCount = computed(
  () =>
    filter(messages.value, ({ state }) => state.value.matches("active"))?.length
);

const scheduledCount = computed(
  () =>
    filter(
      messages.value,
      ({ state }) => state.value.context.scheduled > timestamp.value
    )?.length
);
// ---

function getRandomDelay() {
  const shouldDelay = random(0, 1);
  return !shouldDelay ? useTime().IMMIDIATE : useTime().SECOND * random(1, 10);
}

function getRandomMaxAge() {
  const shouldExpire = random(0, 1);
  return !shouldExpire ? useTime().IMMIDIATE : useTime().SECOND * random(3, 30);
}

function getRandomType() {
  return nth(
    ["error", "info", "base", "primary", "secondary", "success", "warning"],
    random(0, 6)
  );
}

function getRandomDisplay() {
  return nth(["toast", "notification"], random(0, 1));
}

function processMessages(display?: "toast" | "notification" | null) {
  const dummyMessages = Array(random(1, 10));
  forEach(dummyMessages, () => {
    const maxAge = getRandomMaxAge();
    const message = {
      title: faker.lorem.lines(1),
      copy: faker.lorem.paragraph(),
      // data: random(0, 1) === 1 ? faker.lorem.paragraphs(random(1, 3)) : null,
      delay: getRandomDelay(),
      maxAge,
      type: getRandomType(),
      display: display || getRandomDisplay(),
    };
    add(message);
  });
}
</script>
