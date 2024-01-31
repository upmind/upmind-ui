<template>
  <fieldset
    class="form-control group/lookup"
    :disabled="disabled"
    ref="control"
    tabindex="0"
    @blur="doBlur"
    @focus="doFocus"
  >
    <div class="col-span-full text-center" v-if="meta.isLoading || processing">
      <span class="loading loading-dots"></span>
    </div>

    <template v-if="!meta.isLoading">
      <ul class="menu menu-xs bg-base-100 w-full rounded-btn m-0 gap-2">
        <li class="menu-title m-0" v-if="title">
          {{ title }}
        </li>

        <upm-item
          v-for="item in items"
          :key="item.id"
          :item="item"
          :selected="item.id === selected?.id"
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
      </ul>

      <upm-form
        class="shadow border border-neutral col-span-full"
        :item="selected"
        v-if="meta.isEditing"
        :key="selected.id"
        @refresh="refresh"
      ></upm-form>

      <div
        class="actions flex justify-center items-center min-h-36 h-full max-w-full"
        v-if="!meta.isEditing"
      >
        <button class="btn btn-block h-full" @click="add">
          <squares-plus-icon class="w-6 h-6" /> Add new
        </button>
      </div>
    </template>
  </fieldset>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useLookup } from "./composables";
import UpmItem from "./components/Item.vue";
import UpmForm from "./components/Form.vue";
import { SquaresPlusIcon } from "@heroicons/vue/24/outline";

import { isEqual } from "lodash-es";

export default defineComponent({
  name: "UpmLookup",
  components: {
    SquaresPlusIcon,
    UpmItem,
    UpmForm
  },
  emits: ["update:modelValue", "focus", "blur"],
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
    title: {
      type: String,
      default: ""
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
      selected
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
      meta,
      add,
      context,
      errors,
      select,
      refresh,
      edit
    };
  },

  methods: {
    doFocus(event: Event) {
      this.$emit("focus", event);
    },

    doBlur(event: Event) {
      this.$emit("blur", event);
    }
  }
});
</script>
