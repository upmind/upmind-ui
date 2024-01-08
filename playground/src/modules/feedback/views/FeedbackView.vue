<template>
  <section class="feedback w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Feedback</h2>
      </div>

      <div class="actions flex-none join">
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

    <div
      class="grid grid-cols-1 gap-4 my-8 rounded-box p-4 bg-base-200 text-base-content"
      :data-theme="activeTheme"
      v-if="!meta.isEmpty"
    >
      <upm-message
        v-for="(message, hash) in messages"
        :key="hash"
        :machine="message"
      ></upm-message>
    </div>

    <div
      class="grid grid-cols-1 gap-4 my-8 rounded-box p-4 bg-base-200 text-base-content"
      :data-theme="activeTheme"
      v-else
    >
      <h4 class="text-inherit m-0">No Active Messages to Display</h4>
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

const { state, messages, meta, useTime, add } = useFeedback();

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
    const message = {
      title: faker.lorem.lines(1),
      subtitle: faker.lorem.lines(2),
      copy: faker.lorem.paragraph(),
      delay: getRandomDelay(),
      maxAge: getRandomMaxAge(),
      type: getRandomType(),
      display: getRandomDisplay()
    };
    add(message);
  });
}

// ---
</script>
