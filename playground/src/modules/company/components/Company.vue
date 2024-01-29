<template>
  <div
    class="card card-bordered card-compact bg-base-100 focus-within:border-neutral"
    :class="[
      meta.isProcessing ? 'border-neutral' : '',
      meta.hasErrors ? 'border-error' : '',
      meta.isComplete ? 'card-bordered border-primary' : ''
    ]"
  >
    <div class="card-body">
      <h2 class="card-title m-0">
        <map-pin-icon class="w-6 h-6" />
        {{ title }}
      </h2>

      <p class="m-0">
        {{ display }}

        <sub
          v-if="meta.isLoading && !meta.hasErrors"
          class="loading loading-dots loading-xs"
        ></sub>
      </p>

      <p v-if="meta.hasErrors" class="text-error text-sm m-0">
        {{ errors }}
      </p>

      <div class="card-actions justify-between items-center border-t pt-2 mt-2">
        <div class="form-control">
          <label class="cursor-pointer label p-0">
            <input
              type="checkbox"
              class="checkbox"
              :class="{ 'checkbox-primary': selected }"
              :checked="selected"
              @input="select"
            />
            <span class="label-text ml-2">Use this company</span>
          </label>
        </div>

        <details
          ref="target"
          class="dropdown dropdown-end"
          :class="{ 'dropdown-open': open }"
          :open="open"
          @toggle="doToggle($event.currentTarget.open)"
          :disabled="meta.isProcessing"
        >
          <summary role="button" class="btn btn-sm btn-square btn-ghost">
            <sub
              v-if="meta.isProcessing"
              class="loading loading-dots loading-sm"
            ></sub>
            <ellipsis-vertical-icon class="w-6 h-6" v-else />
          </summary>
          <ul
            tabindex="0"
            class="menu menu-xs dropdown-content z-10 p-2 shadow bg-base-100 rounded w-52 mt-0"
          >
            <li
              :class="{
                disabled: meta.isDefault,
                'opacity-50': meta.isDefault
              }"
            >
              <a
                @click.prevent="setDefault"
                class="no-underline"
                :disabled="meta.isDefault || true"
                >Set as default company</a
              >
            </li>

            <li v-if="canCopy">
              <a @click.prevent="copy" class="no-underline">
                <!-- by default, `copied` will be reset in 1.5s -->
                <span v-if="!copied">Copy to clipboard</span>
                <span v-else>Copied!</span>
              </a>
            </li>

            <li>
              <a @click.prevent="edit" class="no-underline">Edit company</a>
            </li>

            <li
              class="border-t pt-3"
              :class="{
                disabled: !meta.canRemove,
                'opacity-50': !meta.canRemove
              }"
            >
              <a
                @click.prevent="remove"
                class="text-error no-underline"
                :disabled="!meta.canRemove"
                >Delete company</a
              >
            </li>
          </ul>
        </details>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useCompany } from "..";
import { MapPinIcon, EllipsisVerticalIcon } from "@heroicons/vue/24/solid";
import { onClickOutside } from "@vueuse/core";
import { useClipboard } from "@vueuse/core";

export default defineComponent({
  name: "UpmCompany",
  components: { MapPinIcon, EllipsisVerticalIcon },
  props: {
    item: {
      type: Object, // xstate actor
      required: true
    },

    selected: {
      type: Boolean,
      default: false
    },

    debugging: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const { text, isSupported, copy, copied } = useClipboard();

    // ------------------------------------------------

    const {
      state,
      context,
      meta,
      errors,
      model,
      title,
      display,
      edit,
      select,
      remove,
      setDefault
    } = useCompany(props.item);

    // ------------------------------------------------

    const target = ref(null);

    onClickOutside(target, () => {
      open.value = false;
    });

    const open = ref(!!props.force);

    function doToggle(value) {
      open.value = value;
    }

    // ---

    // ------------------------------------------------

    return {
      target,
      open,
      doToggle,
      // ---
      state,
      context,
      meta,
      errors,
      model,
      title,
      display,
      select,
      edit: () => {
        open.value = false;
        edit();
      },
      remove: () => {
        open.value = false;
        remove();
      },
      setDefault: () => {
        open.value = false;
        setDefault();
      },

      //  ---
      copy: () => {
        copy(display.value);
      },
      canCopy: isSupported,
      copied
    };
  }
});
</script>
