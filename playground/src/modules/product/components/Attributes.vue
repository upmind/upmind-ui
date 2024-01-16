<template>
  <section class="mt-4" v-for="attribute in attributes" :key="attribute.id">
    <h4 class="">
      {{ attribute.name }}
    </h4>

    <ul
      class="list-none p-4 border border-base-300 bg-base-200 bg-opacity-30 rounded-box"
    >
      <li class="p-0" v-for="value in attribute.values" :key="value.id">
        <fieldset
          class="flex items-center justify-between"
          v-if="modelValue"
          :disabled="processing"
        >
          <label class="label cursor-pointer" :for="`${uuid}-${value.id}`">
            <input
              :type="attribute.multiple ? 'checkbox' : 'radio'"
              :class="attribute.multiple ? 'checkbox' : 'radio'"
              :name="`attributes[${attribute.id}]`"
              @change="
                !processing
                  ? $emit('update:modelValue', attribute, value.id, $event)
                  : null
              "
              :checked="isSelected(attribute.id, value.id)"
              :required="attribute.required"
              :id="`${uuid}-${value.id}`"
              :value="value.id"
            />

            <span class="ml-2"> {{ value.name }}</span>
          </label>

          <div class="flex justify-end items-center">
            <quantity
              v-if="
                value.canChangeQuantity &&
                modelValue?.[attribute.id]?.[value.id]
              "
              :processing="processing"
              :min="value?.min_order_quantity"
              :max="value?.max_order_quantity"
              :step="value?.min_order_quantity || 1"
              :model-value="modelValue[attribute.id][value.id].unit_quantity"
              @update:increment="
                $emit('update:quantity:increment', attribute.id, value, $event)
              "
              @update:decrement="
                $emit('update:quantity:decrement', attribute.id, value, $event)
              "
            ></quantity>

            <!-- price -->
            <span v-if="value?.price?.price_discounted" class="text-right">
              <span class="line-through text-xs block">
                {{
                  !value?.price?.price ? "Free" : value?.price?.price_formatted
                }}
              </span>

              <strong class="text-accent">{{
                value?.price.price_discounted_formatted
              }}</strong>
            </span>

            <strong class="text-right" v-else-if="value?.price?.price">
              {{
                !value?.price?.price ? "Free" : value?.price?.price_formatted
              }}
            </strong>
          </div>
        </fieldset>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { defineComponent, getCurrentInstance } from "vue";
import Quantity from "./Quantity.vue";
import { some } from "lodash-es";

export default defineComponent({
  name: "ProductConfigAttributes",
  components: {
    Quantity
  },
  inheritAttrs: true,
  customOptions: {},
  emits: [
    "update:modelValue",
    "update:quantity:increment",
    "update:quantity:decrement"
  ],
  props: {
    processing: {
      type: Boolean,
      default: false
    },
    attributes: {
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
    function isSelected(attributeId, value) {
      return some(props?.modelValue?.[attributeId], ["product_id", value]);
    }

    return {
      isSelected,
      uuid: getCurrentInstance()?.uid
    };
  },
  computed: {}
});
</script>
