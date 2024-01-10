<template>
  <section class="feedback w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-none gap-2" :data-thtme="activeTheme">
        <h2 class="title m-0">
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

        <!-- <span class="badge badge-secondary">
          {{ notifications.length }}
        </span>
        <span class="badge badge-accent">
          {{ toasts.length }}
        </span> -->
      </div>

      <div class="actions flex-none join ml-auto gap-4 items-center">
        <slot name="actions">
          <button
            class="btn btn-outline btn-sm"
            @click="processMessages"
            :disabled="meta.isProcessing"
          >
            Add Random Messages
          </button>
        </slot>
      </div>
    </header>

    <div
      class="grid grid-cols-1 gap-4 my-8 rounded-box p-4 bg-base-200 text-base-content"
      :data-theme="activeTheme"
    >
      <upm-message
        v-for="message in messages"
        :key="message.id"
        :item="message"
      />
    </div>
    <footer>
      <upm-debug
        title="Feedback"
        :state="state"
        :context="messages"
        :meta="meta"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { inject, ref, computed, onMounted } from "vue";
import { useFeedback } from "..";
import { UpmDebug } from "@upmind/components";
import UpmMessage from "../components/MessageLog.vue";

import { forEach, random, nth, some, filter } from "lodash-es";
import { faker } from "@faker-js/faker";

const activeTheme = inject("activeTheme");

const { state, messages, meta, useTime, add } = useFeedback();

// ---
const timestamp = ref(Date.now());

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
    ["error", "info", "neutral", "primary", "secondary", "success", "warning"],
    random(0, 6)
  );
}

function getRandomDisplay() {
  return nth(["toast", "notification"], random(0, 1));
}

function processMessages() {
  const dummyMessages = Array(random(1, 10));
  forEach(dummyMessages, () => {
    const maxAge = getRandomMaxAge();
    const message = {
      title: random(0, 1) === 1 ? faker.lorem.lines(1) : null,
      copy: faker.lorem.paragraph(),
      data: random(0, 1) === 1 ? faker.lorem.paragraphs(random(1, 3)) : null,
      delay: getRandomDelay(),
      maxAge,
      type: getRandomType(),
      display: getRandomDisplay()
    };
    add(message);
  });
}

// ---

onMounted(() => {
  setInterval(() => {
    timestamp.value = Date.now();
  }, 500);
});
</script>
