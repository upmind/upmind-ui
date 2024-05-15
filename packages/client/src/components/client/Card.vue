<template>
  <article :class="styles.clientCard.root">
    <upw-radio
      :model-value="!!modelValue"
      @input="onSelect"
      no-feedback
      no-status
      size="sm"
      v-if="selectable"
    />
    <div :class="styles.clientCard.content" @click="onSelect">
      <header :class="styles.clientCard.header">
        <h4 :class="styles.clientCard.title">
          {{ title }}
          <upw-badge
            variant="tonal"
            color="base"
            v-if="meta.isDefault"
            label="Default"
          />
        </h4>
      </header>

      <span
        v-for="(line, index) in description?.split(',')"
        :class="styles.clientCard.text"
        :key="`line-${index}`"
        >{{ line }}</span
      >

      <p v-if="meta.hasErrors" :class="styles.clientCard.errors">
        {{ errors }}
      </p>
    </div>

    <footer :class="styles.clientCard.actions">
      <upw-dropdown
        v-if="!noActions"
        toggle="navigation-menu-vertical"
        :toggle-rotate="false"
        :items="actions"
        size="sm"
        grouped
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
import { UpwIcon, UpwRadio, UpwDropdown, UpwBadge } from "@upmind/upwind";

// --- utils
import { onClickOutside } from "@vueuse/core";
import { useClipboard } from "@vueuse/core";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmClientCard",
  components: { UpwIcon, UpwRadio, UpwDropdown, UpwBadge },
  emits: ["update:modelValue"],
  props: {
    item: {
      type: Object, // xstate actor
      required: true,
    },
    i18nKey: { type: String, required: true },
    // ---
    modelValue: { type: Boolean },
    loading: { type: Boolean },
    hidden: { type: Boolean },
    disabled: { type: Boolean },
    noActions: { type: Boolean, default: false },
    selectable: { type: Boolean, default: true },
  },
  setup(props) {
    const useClient = inject("client") as Function;

    const {
      modelValue: selected,
      loading,
      hidden,
      disabled,
      selectable,
    } = toRefs(props);

    const clientCard = useClient(props.item, {
      selected,
      loading,
      hidden,
      disabled,
      selectable,
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
      config,
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
  methods: {
    onSelect() {
      this.$emit("update:modelValue", this.item);
      this.select();
    },
  },
});
</script>
