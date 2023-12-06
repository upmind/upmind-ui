<template>
  <section class="forms w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Domain Manager</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions">
          <select
            class="select select-primary select-bordered w-24 md:w-auto join-item"
            v-model="activeTheme"
            placeholder="Select Theme"
          >
            <option
              v-for="(item, index) in themes"
              :key="`item-${index}`"
              :value="item"
              :label="capitalize(item)"
            ></option>
          </select>
          <span role="button" class="btn btn-square btn-primary join-item">
            <swatch-icon class="h-6 w-6" />
          </span>
        </slot>
      </div>
    </header>

    <div class="content">
      <p>
        This will render a Domain Manager, which is effectively a Basket Helper,
        that will add/remove/sync basket items based on criteria.
      </p>

      <p>
        The Domain manager will also allow users to
        <em>add a New Domain DAC</em>, transfer an
        <em>Existing Domain DAC (internally)</em> or transfer an
        <em>Existing Domain Text field (externally)</em>.
      </p>

      <p>
        Basket Helper Criteria =
        <code>service_identifier == 'domain' ( Product )</code> +
        <code>sld ( Provisioning Field )</code>
      </p>
    </div>

    <!--  -->

    <div
      class="hero min-h-full py-44 bg-base-200 rounded-box my-4 relative z-10"
      :data-theme="activeTheme"
    >
      <div class="hero-content">
        <div class="max-w-3xl">
          <h1 class="text-5xl font-bold text-primary">Choose a domain...</h1>
          <p>
            Thank you for choosing our hosting! We include a free 1 year .com,
            .org, or .net domain name*. <br />
            <small> The discount will be applied at checkout. </small>
          </p>

          <template v-if="meta.showChoices">
            <ul
              tabindex="1"
              role="list"
              class="menu rounded-box bg-base-100 border border-base-300 w-full mt-2"
            >
              <li
                role="listitem"
                v-for="(label, value) in choices"
                :key="value"
                class="p-0"
              >
                <label class="label w-full justify-start">
                  <input
                    type="radio"
                    name="domain-type"
                    class="radio radio-primary"
                    :checked="isSelected(value)"
                    :value="value"
                    @input="choose(value)"
                  />

                  <span class="label-text">{{ label }}</span>
                </label>
              </li>
            </ul>
          </template>

          <div class="min-w-[20rem] max-w-4xl mx-auto">
            <upm-dac-input
              v-if="meta.showRegister"
              @update:modelValue="
                ({ currentTarget: { value } }) => search(value)
              "
              icon="MagnifyingGlassIcon"
              action="Search"
              placeholder="Find your pefect domain &hellip;"
              :autofocus="meta.showRegister"
              autocomplete="url"
            />

            <upm-dac-input
              v-if="meta.showTransfer"
              @update:modelValue="
                ({ currentTarget: { value } }) => search(value)
              "
              icon="MagnifyingGlassIcon"
              action="Find"
              placeholder="Search for the domain to Transfer &hellip;"
              :autofocus="meta.showTransfer"
              autocomplete="url"
            />

            <upm-dac-input
              v-if="meta.showExisting"
              @update:modelValue="({ currentTarget: { value } }) => add(value)"
              placeholder="Enter your Domain &hellip;"
              :autofocus="meta.showExisting"
              autocomplete="url"
              :icon="null"
              action="Use"
              :error="
                meta?.hasErrors
                  ? 'Please enter a valid domain, eg: google.com'
                  : null
              "
            />

            <upm-dac-results-list
              .v-if="meta.showRegister || meta.showTransfer"
              :multiple="true"
              :model-value="selected"
              :results="available"
              :processing="meta.isProcessing"
              @change="({ currentTarget: { value } }) => toggle(value)"
            />
          </div>
        </div>
      </div>
    </div>

    <!--  -->

    <footer>
      <upm-debug
        :open="{ state: true }"
        :debugging="debugging"
        title="Basket"
        :state="state"
        :model="values"
        :context="{ choices, available }"
        :errors="errors"
        :meta="meta"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDomain } from "../";

import { UpmDacResultsList, UpmDacInput, UpmDebug } from "@upmind/components";

import { capitalize } from "lodash-es";
import { SwatchIcon } from "@heroicons/vue/24/outline";

const {
  state,
  meta,
  errors,
  choices,
  available,
  values,
  selected,
  search,
  toggle,
  add,
  choose,
  isSelected
} = useDomain();

const debugging = ref(true);
const activeTheme = ref("default");
const themes = import.meta.env.VITE_THEMES.split(",");
</script>
