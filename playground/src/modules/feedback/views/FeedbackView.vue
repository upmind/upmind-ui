<template>
  <section class="feedback w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-none gap-2">
        <h2 class="title m-0">Feedback</h2>
        <span class="badge badge-primary">
          {{ messages.length }}
        </span>

        <span class="badge badge-secondary">
          {{ notifications.length }}
        </span>
        <span class="badge badge-accent">
          {{ toasts.length }}
        </span>
      </div>

      <div class="actions flex-none join ml-auto">
        <slot name="actions">
          <button
            class="btn btn-ghost"
            @click="processMessages"
            :disabled="meta.isProcessing"
          >
            Add dummy messages
          </button>
        </slot>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-4 my-8" :data-theme="activeTheme">
      <upm-message
        v-for="notification in notifications"
        :key="notification.id"
        :item="notification"
        pending
      />

      <aside
        class="toast toast-top toast-end z-10 grid grid-cols-1 gap-4 mt-24 max-h-[85vh] overflow-auto"
      >
        <upm-message
          v-for="toast in toasts"
          :key="toast.id"
          :item="toast"
          class="max-w-sm"
          pending
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
import { inject } from "vue";
import { useFeedback } from "..";
import { UpmDebug } from "@upmind/components";
import UpmMessage from "../components/Message.vue";
import { forEach, random, nth } from "lodash-es";
import { faker } from "@faker-js/faker";

const activeTheme = inject("activeTheme");

const { state, messages, toasts, notifications, meta, useTime, add } =
  useFeedback();

// ---

function getRandomDelay() {
  const shouldDelay = random(0, 1);
  return !shouldDelay ? useTime().IMMIDIATE : useTime().SECOND * random(0, 10);
}

function getRandomMaxAge() {
  const shouldExpire = random(0, 1);
  return !shouldExpire ? useTime().IMMIDIATE : useTime().SECOND * random(0, 30);
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
</script>
