// -----------------------------------------------------------------------------
/**
 * @module portal/modules/composer/types
 * @description Prop contract for the `composer` module — a message box with
 * the files named beside it (legacy's ticket reply). Data-first: the config
 * names the ACTION VERB the emitted value carries; the module never touches a
 * store.
 */

export interface ComposerModuleProps {
  /** Accessible label for the field. No English default (CC22). */
  readonly label: string;
  readonly placeholder?: string;
  /** The submit control's label. No English default (CC22). */
  readonly submitLabel: string;
  /**
   * The action verb the emit carries — `select` emits `${action}:${json}`,
   * where the model is `{ body, attachments }` (mock/actions.ts protocol).
   */
  readonly action: string;
  /** Accessible label for the attachment-names field. No English default (CC22). */
  readonly attachmentsLabel: string;
  readonly attachmentsPlaceholder?: string;
  /** The post-options control's label. No English default (CC22). */
  readonly optionsLabel: string;
  /** The value that control emits — the form the options dialog opens on. */
  readonly optionsValue: string;
  /** Whether a key sends the message at all, or only the control does. */
  readonly submitWithShortcut?: boolean;
  /**
   * Which key sends it when one does — the OPPOSITE of the client's new-line
   * key, worked out where that preference lives (`composerSubmitKey`). Absent
   * reads as Enter, which is what a brand that states nothing else means.
   */
  readonly submitKey?: ComposerSubmitKey;
}

/** The two keys a reply can be sent with — legacy's `NewLine` pair, inverted. */
export const COMPOSER_SUBMIT_KEY = {
  ENTER: "enter",
  SHIFT_ENTER: "shift-enter"
} as const;

export type ComposerSubmitKey =
  (typeof COMPOSER_SUBMIT_KEY)[keyof typeof COMPOSER_SUBMIT_KEY];

export type ComposerModuleEmits = {
  select: [value: string];
};
