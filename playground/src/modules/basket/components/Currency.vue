<template>
  <upm-dropdown
    v-if="currencies?.length"
    class="input input-bordered input-sm"
    :items="currencies"
    :model-value="model.code"
    :processing="meta.isLoading || meta.isProcessing"
  >
    <template #trigger="">
      <span class="flex gap-2 items-center w-16 mr-2">
        <strong class="badge badge-outline">
          {{ model?.prefix || model?.suffix }}
        </strong>
        {{ model?.code }}
      </span>

      <button
        @click.prevent="update"
        type="submit"
        class="btn btn-outline btn-xs btn-primary border-none"
        :disabled="!meta.isDirty || !meta.isValid || meta.isProcessing"
        v-show="meta.isDirty"
      >
        Update
      </button>
    </template>

    <template #items="{ items, value, toggle }">
      <li
        v-for="currency in items"
        :key="currency.id"
        @click="doSelect(currency, toggle)"
        class="p-0 mx-0 my-1"
      >
        <span :class="{ active: currency?.code == value }">
          <strong class="badge badge-outline">
            {{ currency?.prefix || currency?.suffix }}
          </strong>
          {{ currency?.code }}
        </span>
      </li>
    </template>
  </upm-dropdown>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useBasketCurrency } from "@upmind/vue";
import { UpmDropdown } from "@upmind/ui";

export default defineComponent({
  name: "UpmBasketCurrency",
  components: { UpmDropdown },
  inheritAttrs: true,
  customOptions: {},
  props: {
    actor: {
      type: Object, // xstate actor
      required: true
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props) {
    return {
      ...useBasketCurrency(props.actor)
    };
  },

  computed: {},

  methods: {
    doSelect(currency: Event, callback) {
      debugger;
      this.input(currency);
      if (callback) callback(false);
    }
  }
});
</script>
