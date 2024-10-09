<template>
  <article :class="styles.clientCard.root">
    <UpwRadio
      :model-value="!!selected"
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

          <Badge
            v-for="(badge, index) in badges"
            :key="`badge-${index}`"
            v-bind="badge"
          />
        </h4>
      </header>

      <span
        v-for="(line, index) in description?.split(';')"
        :class="styles.clientCard.text"
        :key="`line-${index}`"
        >{{ line }}</span
      >

      <p v-if="meta.hasErrors" :class="styles.clientCard.errors">
        {{ errors }}
      </p>
    </div>

    <footer :class="styles.clientCard.actions">
      <DropdownMenu v-if="!noActions" :items="actions" size="sm" />
    </footer>
  </article>
</template>

<script>
// --- external
import { defineComponent, inject, toRefs } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwRadio, DropdownMenu } from "@upmind/upwind";

// --- custom elements
import { Badge } from "@upmind/upwind";

// --- utils
import { useClipboard } from "@vueuse/core";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmClientCard",
  components: { Badge, UpwRadio, DropdownMenu },
  emits: ["update:modelValue", "click:action"],
  props: {
    modelValue: {
      type: Object, // xstate actor
      required: true,
    },
    i18nKey: { type: String, required: true },
    // ---
    selected: { type: Boolean },
    loading: { type: Boolean },
    hidden: { type: Boolean },
    disabled: { type: Boolean },
    noActions: { type: Boolean, default: false },
    selectable: { type: Boolean, default: true },
  },
  setup(props) {
    const useClient = inject("client");

    const { selected, loading, hidden, disabled, selectable } = toRefs(props);

    const clientCard = useClient(props.modelValue, {
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

    return {
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
    badges() {
      return [
        {
          label: this.$t(`client.${this.i18nKey}.badges.${this.meta?.type}`),
          variant: "tonal",
          color: "base",
          visible: !!this.meta?.type,
        },
        {
          label: this.$t(`client.${this.i18nKey}.badges.default`),
          variant: "tonal",
          color: "base",
          visible: this.meta.isDefault,
        },
      ];
    },
    actions() {
      return [
        {
          label: this.$tc(`client.${this.i18nKey}.actions.select`),
          hidden: this.meta.isDefault, //|| !this.meta.isVerified,
          icon: "check-square",
          handler: () => {
            this.open = false;
            this.setDefault();
          },
        },
        {
          icon: "edit",
          label: this.$tc(`client.${this.i18nKey}.actions.edit`),
          handler: () => {
            this.open = false;
            this.edit();
          },
        },
        {
          icon: "remove",
          label: this.$tc(`client.${this.i18nKey}.actions.delete`),
          hidden: !this.meta.canRemove,
          class:
            "text-destructive data-[highlighted]:bg-destructive-50 data-[highlighted]:text-destructive",

          handler: () => {
            this.open = false;
            this.remove();
          },
        },
        {
          icon: "copy",
          label: this.$tc(
            `client.${this.i18nKey}.actions.copy`,
            this.copied ? 0 : 1
          ),
          hidden: !this.isSupported,
          handler: () => {
            this.open = false;
            this.copy(this.description);
          },
        },
      ];
    },
  },
  methods: {
    onSelect() {
      this.$emit("update:modelValue", this.modelValue);
      this.select();
    },
  },
});
</script>
