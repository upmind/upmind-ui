<template>
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
        <upw-icon
          :class="styles.clientCard.avatar"
          v-if="country?.code"
          :icon="{
            path: 'flags',
            name: country?.code?.toLowerCase(),
          }"
        />

        <div>
          <h4 :class="styles.clientCard.title">
            {{ title }}
          </h4>
          <span>{{ description }}</span>
        </div>
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

      <span :class="styles.clientCard.verified">
        <upw-icon
          :icon="meta.isVerified ? 'check-circle' : 'alert-triangle'"
          :class="styles.clientCard.icon"
        />
        <span class="sr-only">
          {{ meta.isVerified ? "Verified" : "Unverified" }}
        </span>
      </span>

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
import { defineComponent, inject, ref, toRefs } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwIcon, UpwCheckbox, UpwDropdown } from "@upmind/upwind";

// --- utils
import { onClickOutside } from "@vueuse/core";
import { useClipboard } from "@vueuse/core";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmClientCard",
  components: { UpwIcon, UpwCheckbox, UpwDropdown },
  props: {
    item: {
      type: Object, // xstate actor
      required: true,
    },
    i18nKey: { type: String, required: true },
    // ---
    selected: { type: Boolean },
    loading: { type: Boolean },
    hidden: { type: Boolean },
    disabled: { type: Boolean },
  },
  setup(props) {
    const useClient = inject("client") as Function;

    const { selected, loading, hidden, disabled } = toRefs(props);
    const clientCard = useClient(props.item, {
      selected,
      loading,
      hidden,
      disabled,
    });

    const styles = useStyles(["clientCard"], clientCard.meta, config);

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
      ...clientCard,
      // ---
      isSupported,
      copy,
      copied,
      //  ---
    };
  },
  computed: {
    actions() {
      return [
        {
          label: this.$tc(`client.${this.i18nKey}.actions.select`),
          disabled: this.meta.isDefault, //|| !this.meta.isVerified,
          action: () => {
            this.open = false;
            this.setDefault();
          },
        },
        {
          label: this.$tc(`client.${this.i18nKey}.actions.edit`),
          action: () => {
            this.open = false;
            this.edit();
          },
        },
        {
          label: this.$tc(`client.${this.i18nKey}.actions.delete`),
          disabled: !this.meta.canRemove,
          action: () => {
            this.open = false;
            this.remove();
          },
        },
        {
          label: this.$tc(
            `client.${this.i18nKey}.actions.copy`,
            this.copied ? 0 : 1
          ),
          disabled: !this.isSupported,
          action: () => {
            this.open = false;
            this.copy(this.description);
          },
        },
      ];
    },
  },
});
</script>
