<template>
  <section class="hero min-h-screen py-12 items-center bg-base-200 rounded-box">
    <div class="hero-content">
      <div class="w-full max-w-5xl">
        <header>
          <h1 class="text-5xl font-bold text-primary">
            <template v-if="!meta.hasPrimary">Choose a domain&hellip;</template>
            <template v-else>
              Congrats!
              <span class="text-2xl font-bold text-primary m-0">
                You have selected your domain&hellip;
              </span></template
            >
          </h1>

          <p>
            Thank you for choosing our hosting! We include a free 1 year .com,
            .org, or .net domain name*. <br />
            <small> The discount will be applied at checkout. </small>
          </p>
        </header>

        <!--  choices -->

        <ul
          v-if="meta.isLoading"
          role="list"
          class="relative rounded-box min-h-[10rem] bg-base-100 base-content border border-base-300 divide-lm-contrast/10 dark:divide-dm-contrast/10 divide-y mt-12 w-full p-0 m-0 overflow-hidden"
        >
          <li
            class="absolute top-0 left-0 w-full h-full bg-primary-content text-primary place-content-center gap-x-4 gap-y-1 mt-0 px-4 py-4 transition-colors sm:flex sm:flex-wrap sm:pl-6 z-10"
          >
            <span class="text-lg text-center">
              <span class="block">Loading the basket</span>
              <!-- <progress class="progress progress-primary"></progress> -->
              <span class="loading loading-dots"></span>
            </span>
          </li>
        </ul>

        <upm-domain-choices
          v-else-if="meta.showChoices"
          :choices="choices"
          :model-value="selectedType"
          @update:modelValue="({ currentTarget: { value } }) => choose(value)"
        />

        <!-- selections -->

        <div>
          <upm-domain-input
            v-if="meta.showRegister"
            @update:modelValue="({ currentTarget: { value } }) => search(value)"
            icon="MagnifyingGlassIcon"
            action="Search"
            placeholder="Find your pefect domain &hellip;"
            :autofocus="meta.showRegister"
            autocomplete="url"
          />

          <upm-domain-input
            v-if="meta.showTransfer"
            @update:modelValue="({ currentTarget: { value } }) => search(value)"
            icon="MagnifyingGlassIcon"
            action="Find"
            placeholder="Search for the domain to Transfer &hellip;"
            :autofocus="meta.showTransfer"
            autocomplete="url"
          />

          <upm-domain-input
            v-if="meta.showExisting"
            @update:modelValue="({ currentTarget: { value } }) => add(value)"
            placeholder="Enter your Domain &hellip;"
            :autofocus="meta.showExisting"
            autocomplete="off"
            :suggestions="available"
            :icon="null"
            :error="
              meta?.hasErrors
                ? 'Please enter a valid domain, eg: google.com'
                : null
            "
            :model-value="primaryDomain?.domain"
          />

          <upm-domain-available
            v-if="meta.showRegister || meta.showTransfer"
            :multiple="true"
            :model-value="selected"
            :results="available"
            :processing="meta.isSearching"
            :syncing="meta.isSyncing"
            @change="({ currentTarget: { value } }) => toggle(value)"
          />

          <upm-domain-select
            v-if="meta.showBasket"
            :model-value="primaryDomain?.domain"
            :domains="values"
            :processing="meta.isProcessing"
            @change="({ currentTarget: { value } }) => setPrimaryDomain(value)"
          />
        </div>

        <slot
          name="actions"
          v-bind="{ meta, primaryDomain, values }"
          v-if="!meta.isLoading"
        >
        </slot>
      </div>
    </div>
  </section>

  <upm-debug
    :open="{ state: true }"
    :debugging="debugging"
    title="Domain"
    :state="state"
    :model="values"
    :context="{ choices, available }"
    :errors="errors"
    :meta="meta"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- internal
import { useDomain } from "./composables";
import UpmDomainAvailable from "./components/Available.vue";
import UpmDomainInput from "./components/Input.vue";
import UpmDomainChoices from "./components/Choices.vue";
import UpmDomainSelect from "./components/Select.vue";
import UpmDebug from "../debug/Debug.vue";

// --- utils

// ---------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDomain",
  inheritAttrs: false,
  components: {
    UpmDomainAvailable,
    UpmDomainInput,
    UpmDomainChoices,
    UpmDomainSelect,
    UpmDebug
  },
  props: {
    syncBasket: {
      type: Boolean
    },
    type: {
      type: String,
      validator: (value: string) =>
        ["register", "transfer", "existing"].includes(value)
    },
    promotions: {
      type: Array,
      default: () => []
    },
    currencyCode: {
      type: String,
      default: ""
    },
    promotion: {
      type: Array,
      default: () => []
    },
    limit: {
      type: Number,
      default: 10
    },
    debugging: {
      type: Boolean,
      default: false
    },
    parent: {
      type: String
    }
  },

  setup(props) {
    return useDomain(props.syncBasket, props.type, props.parent);
  }
});
</script>
