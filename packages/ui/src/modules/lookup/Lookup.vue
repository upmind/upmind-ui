<template>
  <fieldset
    class="form-control group/lookup"
    :disabled="disabled"
    ref="control"
    tabindex="0"
    @blur="doBlur"
    @focus="doFocus"
  >
    <upm-dropdown
      class="input input-bordered"
      v-if="!meta.isEditing"
      :items="items"
      :model-value="selected"
      :processing="meta.isLoading || meta.isProcessing || processing"
    >
      <template #trigger="{ toggle }">
        <input
          ref="trigger"
          @focus="doOpen(toggle)"
          class="w-full"
          :placeholder="placeholder"
          :value="
            meta.isFiltered || meta.isProcessing ? filters : title || value
          "
          @input="filter($event.currentTarget.value)"
        />
      </template>

      <template #items="{ items, value, toggle }">
        <upm-item
          v-for="item in items"
          :key="item.id"
          :item="item"
          :selected="item.id === value"
          :disabled="disabled || meta.isEditing || processing"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          @select="doSelect($event, toggle)"
          @edit="edit"
          :class="[
            meta.isEditing || processing
              ? 'hidden opacity-50 pointer-events-none'
              : '',
            {
              'border-primary': item.id === selected?.id,
              // 'col-span-full': item.id === selected?.id && meta.isEditing
            },
          ]"
        />
      </template>

      <template #append v-if="!noAdd">
        <button class="btn btn-sm btn-block" @click="add">
          <plus-icon class="w-4 h-4" /> Add new
        </button>
      </template>
    </upm-dropdown>

    <upm-form
      class="shadow border border-neutral col-span-full mt-2"
      :item="selectedActor"
      v-if="meta.isEditing && selected"
      :key="selected"
      @refresh="refresh"
    ></upm-form>
  </fieldset>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useLookup } from "@upmind/vue";
import UpmItem from "./components/Item.vue";
import UpmForm from "./components/Form.vue";
import UpmDropdown from "../../components/Dropdown.vue";
import { PlusIcon } from "@heroicons/vue/24/outline";

import { isEqual } from "lodash-es";

export default defineComponent({
  name: "UpmLookup",
  components: {
    PlusIcon,
    UpmItem,
    UpmForm,
    UpmDropdown,
  },
  emits: ["update:modelValue", "change", "focus", "blur"],
  props: {
    lookup: {
      type: Function,
      required: true,
    },
    modelValue: {
      type: String,
      default: "",
    },
    processing: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    debugging: {
      type: Boolean,
      default: false,
    },

    placeholder: {
      type: String,
      default: "Select an item",
    },
    noAdd: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const {
      meta,
      errors,
      items,
      add,
      select,
      refresh,
      edit,
      filter,
      filters,
      selected,
      selectedActor,
      value,
      title,
      description,
    } = useLookup(props.lookup);

    if (props.modelValue) {
      select(props.modelValue);
    }

    watch(selected, (newValue, oldValue) => {
      if (isEqual(newValue?.id, oldValue?.id)) return;
      emit("update:modelValue", selected.value?.id);
    });

    return {
      items,
      selected,
      selectedActor,
      value,
      title,
      description,
      meta,
      add,
      errors,
      select,
      filter,
      filters,
      refresh,
      edit,
      // ---
      trigger: ref(null),
    };
  },
  watch: {
    results(value) {
      this.active = this.focused && (!!value?.length || this.meta.isProcessing);
    },
    focused(value) {
      this.active = value && (!!this.results?.length || this.meta.isProcessing);
      if (!value) {
        this.active = false;
      }
    },
  },

  methods: {
    doOpen(callback) {
      this.trigger?.select();
      callback(true);
    },
    doFocus(event: Event) {
      this.$emit("focus", event);
    },

    doBlur(event: Event) {
      this.$emit("blur", event);
    },

    doSelect(event: Event, callback) {
      this.$emit("update:modelValue", event?.currentTarget?.value);
      this.$emit("change", event);
      this.select(event?.currentTarget?.value);
      if (callback) callback(false);
    },
  },
});
</script>
.
