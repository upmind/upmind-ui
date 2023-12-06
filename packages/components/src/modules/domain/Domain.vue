<template>
  <section class="hero min-h-screen py-12 items-center bg-base-200 rounded-box">
    <div class="hero-content">
      <div class="max-w-3xl">
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

        <upm-domain-choices
          v-if="meta.showChoices"
          :choices="choices"
          :model-value="selectedType"
          @update:modelValue="({ currentTarget: { value } }) => choose(value)"
        />

        <!-- selections -->

        <div class="min-w-[20rem] max-w-4xl mx-auto">
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
          />

          <upm-domain-available
            v-if="meta.showRegister || meta.showTransfer"
            :multiple="true"
            :model-value="selected"
            :results="available"
            :processing="meta.isProcessing"
            @change="({ currentTarget: { value } }) => toggle(value)"
          />
        </div>

        <template v-if="meta.showContinue">
          <slot name="actions" v-bind="{ meta, primaryDomain, values }"> </slot>
        </template>
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
    UpmDebug
  },
  props: {
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
    }
  },

  setup(props) {
    return useDomain(props.type);
  }
});
</script>
