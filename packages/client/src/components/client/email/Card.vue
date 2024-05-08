<template>
  <!-- <sub
        v-if="meta.isLoading && !meta.hasErrors"
        class="loading loading-dots loading-xs"
      ></sub>
       -->
  <article :class="styles.clientCard.root">
    <upw-checkbox
      :class="{ 'checkbox-primary': selected }"
      v-model="selected"
      @input="select"
      no-feedback
      no-status
    />
    <div :class="styles.clientCard.content">
      <header :class="styles.clientCard.header">
        <p :class="[styles.clientCard.meta, styles.clientCard.verified]">
          <upw-icon
            :icon="meta.isVerified ? 'email-check' : 'email-warning'"
            :class="styles.clientCard.avatar"
          />
          <span class="sr-only">
            {{ meta.isVerified ? "Verified" : "Unverified" }}
          </span>
        </p>

        <h4 :class="styles.clientCard.title">
          {{ title }}
        </h4>
      </header>

      <p v-if="meta.hasErrors" :class="styles.clientCard.errors">
        {{ errors }}
      </p>
    </div>

    <footer :class="styles.clientCard.actions">
      <upw-icon
        icon="star"
        v-if="meta.isDefault"
        :class="styles.clientCard.default"
      ></upw-icon>

      <upw-dropdown
        toggle="navigation-menu-vertical"
        :toggle-rotate="false"
        :items="actions"
        size="sm"
      />
    </footer>
  </article>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, toRefs } from "vue";

// --- internal
import { useClientEmail } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "../config.cva";

// --- components
import { UpwIcon, UpwCheckbox, UpwDropdown } from "@upmind/upwind";

// --- utils
import { onClickOutside } from "@vueuse/core";
import { useClipboard } from "@vueuse/core";
import { omit } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmEmail",
  components: { UpwIcon, UpwCheckbox, UpwDropdown },
  props: {
    item: {
      type: Object, // xstate actor
      required: true,
    },
    // ---
    selected: { type: Boolean },
    loading: { type: Boolean },
    hidden: { type: Boolean },
    disabled: { type: Boolean },
  },
  setup(props) {
    const { selected, loading, hidden, disabled } = toRefs(props);
    const clientEmail = useClientEmail(props.item, {
      selected,
      loading,
      hidden,
      disabled,
    });
    const styles = useStyles(["clientCard"], clientEmail.meta, config);

    // ------------------------------------------------

    const { isSupported, copy, copied } = useClipboard();

    // ------------------------------------------------

    const target = ref(null);

    onClickOutside(target, () => {
      open.value = false;
    });

    const open = ref(!!props.force);

    function doToggle(value) {
      open.value = value;
    }

    // ------------------------------------------------

    return {
      target,
      open,
      doToggle,
      // ---
      styles,
      ...clientEmail,
      // ---
      actions: [
        {
          label: "Edit",
          icon: "edit",
          action: () => {
            open.value = false;
            clientEmail.edit();
          },
        },
        {
          label: "Remove",
          icon: "remove",
          action: () => {
            open.value = false;
            clientEmail.remove();
          },
        },
        {
          label: "Set as default",
          icon: "star",
          action: () => {
            open.value = false;
            clientEmail.setDefault();
          },
        },
      ],
      //  ---
      copy: () => {
        copy(description.value);
      },
      canCopy: isSupported,
      copied,
    };
  },
});
</script>
