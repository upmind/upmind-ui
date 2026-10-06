// -----------------------------------------------------------------------------
/**
 * @module portal/mock/impersonation
 * @description The impersonation ribbon, and the persona it holds for the
 * way back. A parent logging in as a child account (plan R10) is a PERSONA
 * SWAP, not a session: `useMockRelation` swaps the dataset's persona and
 * opens this ribbon with the child's name; the ribbon's own End control
 * closes it and restores what is held here. No token, no session transfer —
 * the ribbon IS the capability's mock.
 */

import { computed, ref } from "vue";
import type { MockPersona } from "./types";
import type { ComputedRef, Ref } from "vue";
// -----------------------------------------------------------------------------

type MockImpersonationState = {
  /** Whose portal is showing — the ribbon's name. */
  readonly name: string;
  /** Who to become again when it ends. */
  readonly restore: MockPersona;
};

const state: Ref<MockImpersonationState | undefined> = ref(undefined);

export function useMockImpersonation(): {
  isImpersonating: ComputedRef<boolean>;
  impersonatedName: ComputedRef<string | undefined>;
  restoredName: ComputedRef<string | undefined>;
  begin: (name: string, restore: MockPersona) => void;
  end: () => MockPersona | undefined;
} {
  return {
    isImpersonating: computed(() => state.value !== undefined),
    impersonatedName: computed(() => state.value?.name),
    /** Who the portal goes back to — the account whose child is standing in. */
    restoredName: computed(() => state.value?.restore.name),
    /** Opens the ribbon. A second begin keeps the FIRST persona to restore — one way back, however deep the swaps go. */
    begin: (name: string, restore: MockPersona) => {
      const held = state.value?.restore ?? restore;
      state.value = { name, restore: held };
    },
    /** Closes the ribbon and hands back the persona to restore; undefined when nothing was held. */
    end: (): MockPersona | undefined => {
      const held = state.value?.restore;
      state.value = undefined;
      return held;
    }
  };
}
