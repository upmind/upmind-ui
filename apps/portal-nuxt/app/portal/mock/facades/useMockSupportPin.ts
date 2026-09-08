// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockSupportPin
 * @description The client's support PIN, managed — the mock stand-in for
 * `useClientSupportPin` (`contracts/client-support-pin.ts`). Legacy's panel
 * shows it masked, reveals it on demand and mints a new one on request; the
 * brand gate (`SUPPORT_PIN_ENABLED`) is config, not a member here.
 *
 * Whether the PIN is SHOWING is view state, not data — this session's, for
 * this client — so it is held beside the seed exactly as the provisioning
 * facade holds an opened frame, and the dataset carries only the PIN itself.
 *
 * CHANGE (plan §3): the contract names `reveal()`; legacy's panel also hides
 * again, so `hide()` is the member the real module will need beside it.
 */

import { ref } from "vue";
import { nextSequence } from "../store";
import { defineMockFacade } from "./facade";
import { assign } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { MockPersona } from "../types";

/** The four-digit range a PIN is minted into. */
const PIN_FLOOR = 1000;
const PIN_SPAN = 9000;
/** Coprime with the span, so successive mints walk the whole range. */
const PIN_STRIDE = 2971;

/** Whose PIN is showing this session, by client id — never written to the seed. */
const revealed = ref<Readonly<Record<string, boolean>>>({});

/** Deterministic, never `Math.random`: the id sequence walked into four digits. */
function mintPin(): string {
  return String(PIN_FLOOR + ((nextSequence() * PIN_STRIDE) % PIN_SPAN));
}

/** Whether this client's PIN is showing — the panel's masked/plain state. */
export function isSupportPinRevealed(persona: MockPersona): boolean {
  return revealed.value[persona.id] === true;
}

export const useMockSupportPin = defineMockFacade(
  (data): MockPersona => data.persona,
  data => {
    function setRevealed(value: boolean): MockActionReceipt<MockPersona> {
      revealed.value = assign({}, revealed.value, {
        [data.persona.id]: value
      });
      return { ok: true, entity: data.persona };
    }

    return {
      /** Shows the PIN in full. */
      reveal: (): MockActionReceipt<MockPersona> => setRevealed(true),

      /** Masks it again. */
      hide: (): MockActionReceipt<MockPersona> => setRevealed(false),

      /**
       * Issues a fresh PIN. The old one stops working the moment it is
       * replaced, which is the whole point of the control, so the new one is
       * shown rather than left masked.
       */
      regenerate: (): MockActionReceipt<MockPersona> => {
        assign(data, {
          persona: assign({}, data.persona, { supportPin: mintPin() })
        });
        return setRevealed(true);
      }
    };
  }
);
