<template>
  <section class="provisioning" v-if="fields?.length">
    <h4 class="">Additional Information</h4>

    <ul
      class="list-none p-4 border border-base-300 bg-base-200 bg-opacity-30 rounded-xl"
    >
      <template v-for="field in fields" :key="field.id">
        <li class="p-0" v-if="field.defer_mode != 'hidden'">
          <fieldset class="flex flex-col" :disabled="processing">
            <label class="label text-start w-full" :for="field.id">
              <span class="label-text">{{ field.field_label }}</span>
            </label>

            <select
              class="select select-bordered w-full max-w-xs"
              v-if="field.field_type == 'select'"
              :name="`fields[${field.id}]`"
              :value="getValue(field.name)"
              :required="field.required"
              @input="doUpdate(field.name, $event.target.value)"
              :id="field.id"
            >
              <option v-for="option in field.options" v-bind="option"></option>
            </select>

            <textarea
              v-else-if="field.field_type == 'textarea'"
              class="textarea textarea-bordered w-full max-w-xs"
              :name="`fields[${field.id}]`"
              :value="getValue(field.name)"
              :required="field.required"
              :id="field.id"
              @input="doUpdate(field.name, $event.target.value)"
            ></textarea>

            <input
              v-else
              class="input input-bordered w-full max-w-xs"
              :type="field.field_type.replace('input_', '')"
              :name="`fields[${field.id}]`"
              :value="getValue(field.name)"
              :required="field.required"
              :id="field.id"
              @input="doUpdate(field.name, $event.target.value)"
            />
          </fieldset>
        </li>
      </template>
    </ul>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { get, debounce } from "lodash-es";

export default defineComponent({
  name: "ProductConfigProvisioning",
  components: {},
  inheritAttrs: true,
  customOptions: {},
  props: {
    processing: {
      type: Boolean,
      default: false
    },
    fields: {
      type: Array,
      default: () => [],
      required: true
    },
    modelValue: {
      type: Object,
      required: true
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { emit }) {
    function getValue(field) {
      const value = get(props.modelValue, field, null);
      return value;
    }

    const doUpdate = debounce(
      (field, value) => emit("update", field, value),
      500
    );

    return {
      getValue,
      doUpdate
    };
  },
  computed: {}
});
</script>
