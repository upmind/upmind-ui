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
      :model-value="selected?.id"
      :processing="meta.isLoading || meta.isProcessing || processing"
    >
      <template #trigger="{ toggle }">
        <input
          ref="trigger"
          @focus="doOpen(toggle)"
          class="w-full"
          :placeholder="placeholder"
          :value="meta.isFiltered ? filters : title || value"
          @input="filter($event.currentTarget.value)"
        />
      </template>

      <template #items="{ items, value }">
        <upm-item
          v-for="item in items"
          :key="item.id"
          :item="item"
          :selected="item.id === value"
          :disabled="disabled || meta.isEditing || processing"
          @select="select"
          @edit="edit"
          :class="[
            meta.isEditing || processing
              ? 'hidden opacity-50 pointer-events-none'
              : '',
            {
              'border-primary': item.id === selected?.id
              // 'col-span-full': item.id === selected?.id && meta.isEditing
            }
          ]"
        />
      </template>

      <template #append>
        <button class="btn btn-sm btn-block" @click="add">
          <plus-icon class="w-4 h-4" /> Add new
        </button>
      </template>
    </upm-dropdown>

    <upm-form
      class="shadow border border-neutral col-span-full mt-2"
      :item="selected"
      v-if="meta.isEditing && selected"
      :key="selected.id"
      @refresh="refresh"
    ></upm-form>
  </fieldset>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useLookup } from "./";
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
    UpmDropdown
  },
  emits: ["update:modelValue", "change", "focus", "blur"],
  props: {
    lookup: {
      type: Function,
      required: true
    },
    modelValue: {
      type: String,
      default: ""
    },
    processing: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    debugging: {
      type: Boolean,
      default: false
    },

    placeholder: {
      type: String,
      default: "Select an item"
    }
  },
  setup(props, { emit }) {
    const {
      state,
      context,
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
      value,
      title,
      description
    } = useLookup(props.lookup);

    if (props.modelValue) {
      select(props.modelValue);
    }

    watch(selected, (newValue, oldValue) => {
      if (isEqual(newValue?.id, oldValue?.id)) return;
      emit("update:modelValue", selected.value?.id);
    });

    return {
      state,
      items,
      selected,
      value,
      title,
      description,
      meta,
      add,
      context,
      errors,
      select,
      filter,
      filters,
      refresh,
      edit,
      // ---
      trigger: ref(null)
    };
  },
  watch: {
    selected(value, oldValue) {
      // weve got a new value, that is not the same as the old value
      // so we need to emit the change
      if (oldValue?.id !== value?.id) {
        this.$emit("update:modelValue", value?.id);
        this.$emit("change", { currentTarget: { value: value?.id } });
      }
    },
    results(value) {
      this.active = this.focused && (!!value?.length || this.meta.isProcessing);
    },
    focused(value) {
      this.active = value && (!!this.results?.length || this.meta.isProcessing);
      if (!value) {
        this.active = false;
      }
    }
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
    }
  }
});
</script>
