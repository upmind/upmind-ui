<template>
  <section class="feedback w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-none gap-2">
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
            class="btn btn-circle btn-sm"
            @click="showScheduled = !showScheduled"
            v-if="hasScheduled"
          >
            <eye-slash-icon
              class="w-6 h-6"
              v-if="showScheduled"
            ></eye-slash-icon>

            <eye-icon class="w-6 h-6" v-else></eye-icon>

            <span class="sr-only"
              >{{ showScheduled ? "Hide" : "Show" }} scheduled</span
            >
          </button>

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
        v-for="notification in notifications"
        :key="notification.id"
        :item="notification"
        :scheduled="showScheduled"
      />

      <aside
        class="toast toast-top toast-end z-10 grid grid-cols-1 gap-4 mt-24 max-h-[85vh] overflow-auto"
      >
        <upm-message
          v-for="toast in toasts"
          :key="toast.id"
          :item="toast"
          class="max-w-sm"
          :scheduled="showScheduled"
        ></upm-message>
      </aside>

      <h4 class="text-inherit m-0 p-4" v-if="meta.isEmpty">
        No Active Messages to Display
      </h4>
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
import { EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/outline";

import UpmMessage from "../components/Message.vue";
import { forEach, random, nth, some, filter } from "lodash-es";
import { faker } from "@faker-js/faker";

const activeTheme = inject("activeTheme");

const showScheduled = ref(false);

const { state, messages, toasts, notifications, meta, useTime, add } =
  useFeedback();

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

// ---

function processMessages() {
  const dummyMessages = Array(random(1, 10));
  forEach(dummyMessages, () => {
    const maxAge = getRandomMaxAge();
    const message = {
      title: random(0, 1) === 1 ? faker.lorem.lines(1) : null,
      subtitle: random(0, 1) === 1 ? faker.lorem.lines(2) : null,
      copy: faker.lorem.paragraph(),
      delay: getRandomDelay(),
      maxAge,
      type: getRandomType(),
      display: getRandomDisplay(),
      dismissable: maxAge ? random(0, 1) === 1 : true
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
