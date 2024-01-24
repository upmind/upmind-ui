<template>
  <div
    class="card card-bordered card-compact bg-base-100"
    :class="[
      meta.hasErrors ? '  border-error' : '',
      meta.isComplete ? ' card-bordered border-primary' : ''
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
          class="loading loading-dots loading-xs opacity-25"
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
            <span class="label-text ml-2">Use this address</span>
          </label>
        </div>

        <details
          ref="target"
          class="dropdown dropdown-end"
          :class="{ 'dropdown-open': open }"
          :open="open"
          @toggle="doToggle($event.currentTarget.open)"
        >
          <summary role="button" class="btn btn-sm btn-square btn-ghost">
            <ellipsis-vertical-icon class="w-6 h-6" />
          </summary>
          <ul
            tabindex="0"
            class="menu menu-xs dropdown-content z-10 p-2 shadow bg-base-100 rounded w-52 mt-0"
          >
            <li><a @click.prevent="setDefault">Set as default address</a></li>

            <li v-if="canCopy">
              <a @click="copy">
                <!-- by default, `copied` will be reset in 1.5s -->
                <span v-if="!copied">Copy to clipboard</span>
                <span v-else>Copied!</span>
              </a>
            </li>

            <li><a @click.prevent="edit">Edit address</a></li>
            <li><a @click.prevent="remove">Delete address</a></li>
          </ul>
        </details>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useSystemPlace } from "..";
import { MapPinIcon, EllipsisVerticalIcon } from "@heroicons/vue/24/solid";
import { onClickOutside } from "@vueuse/core";
import { useClipboard } from "@vueuse/core";

export default defineComponent({
  name: "UpmPlace",
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
      cancel,
      remove,
      setDefault
    } = useSystemPlace(props.item);

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
