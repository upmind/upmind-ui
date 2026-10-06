// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockPersonalDetails
 * @description The client's own profile — the mock stand-in for headless's
 * `usePersonalDetailsManager` (plan §3, "Profile"). One record, three writes:
 * the four native fields legacy's profile form carries, the brand's own
 * questions about the client, and the name they sign in with.
 *
 * Every write answers with a receipt rather than feedback — which copy it
 * earns is the dispatcher's call (plan R4).
 */

import {
  BlueprintFieldsTypes,
  CustomFieldsTypes
} from "@upmind-automation/types";
import { NEW_LINE_KEY } from "../contracts/client-tickets";
import { MOCK_ENTER_KEY_ACTION } from "../types";
import { defineMockFacade, MOCK_RECEIPT_REASON } from "./facade";
import {
  assign,
  find,
  forEach,
  get,
  includes,
  isFinite,
  isString,
  keys,
  toNumber,
  trim
} from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type {
  NewLineKey,
  SupportPreferencesModel
} from "../contracts/client-tickets";
import type {
  MockClientCustomField,
  MockCustomFieldValue,
  MockDataset,
  MockPersona,
  MockSupportPreferences
} from "../types";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/**
 * One native field as the save stores it. A key the model does not carry is a
 * field the client CLEARED, not one they left alone: `JSON.stringify` drops
 * an `undefined` value on the way through the verb's tail, so absence is the
 * only spelling a cleared field ever arrives in.
 */
function savedField(model: FormModel, field: string): string {
  return trim(asText(model[field]));
}

/** A submitted answer as the field stores it — a cleared one is an empty answer. */
function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (isString(value)) return value;
  return String(value);
}

/** The wire's own spellings for a tick box — `typeId` carries no CHECKBOX member. */
const CHECKBOX_TYPE_CODES: readonly string[] = [
  BlueprintFieldsTypes.CHECKBOX,
  "tick_box"
];

/**
 * One answer, in the type that field's own schema declares
 * (`contracts/client-custom-fields.schemas.ts`) — so a checkbox stores a
 * boolean and a number field a number rather than the text of one. The
 * discriminators are the schema parser's own, which is what keeps the stored
 * value and the schema that validates it agreeing.
 */
function customFieldValue(
  field: MockClientCustomField,
  raw: unknown
): MockCustomFieldValue {
  if (includes(CHECKBOX_TYPE_CODES, field.type)) return raw === true;
  if (field.typeId === CustomFieldsTypes.NUMBER) {
    const parsed = toNumber(raw);
    if (isFinite(parsed)) return parsed;
    return 0;
  }
  return asText(raw);
}

/**
 * Whether Enter sends the reply for this client. The client's own answer
 * where they have given one, and the brand's `UI_ENTER_KEY_ACTION` until they
 * do — one derivation, so the composer and the form it opens can never
 * disagree about what the key does.
 */
export function submitsWithShortcut(data: MockDataset): boolean {
  const answered = data.persona.supportPreferences;
  if (answered !== undefined) return answered.submitWithShortcut;
  return data.features.UI_ENTER_KEY_ACTION === MOCK_ENTER_KEY_ACTION.SUBMIT;
}

/**
 * Which key starts a NEW LINE for this client — the client's own answer where
 * they have given one, and the brand's `UI_ENTER_KEY_ACTION` until they do.
 * The brand states which key SENDS, so the new-line key is the other one:
 * `submit` leaves the new line on Shift and Enter, `newline` puts it on Enter.
 */
export function newLineKey(data: MockDataset): NewLineKey {
  const answered = data.persona.supportPreferences;
  if (answered !== undefined) return answered.newLineKey;
  const sendsOnEnter =
    data.features.UI_ENTER_KEY_ACTION === MOCK_ENTER_KEY_ACTION.SUBMIT;
  if (sendsOnEnter) return NEW_LINE_KEY.SHIFT_ENTER;
  return NEW_LINE_KEY.ENTER;
}

/**
 * Which key SENDS the reply — the opposite of the new-line key, and only while
 * the shortcut is on at all. One derivation, so the composer's own key and the
 * form that sets it can never disagree.
 */
export function composerSubmitKey(data: MockDataset): NewLineKey | undefined {
  if (!submitsWithShortcut(data)) return undefined;
  if (newLineKey(data) === NEW_LINE_KEY.ENTER) return NEW_LINE_KEY.SHIFT_ENTER;
  return NEW_LINE_KEY.ENTER;
}

export const useMockPersonalDetails = defineMockFacade(
  (data): MockPersona => data.persona,
  data => ({
    /**
     * Saves the four native profile fields; anything else in the model is
     * ignored. Each is written EXPLICITLY rather than picked, so a field the
     * client cleared is cleared on the persona too — `pick` cannot tell an
     * absent key from a cleared one, and the tail only ever carries the
     * absent spelling.
     */
    saveProfile: (model: FormModel): MockActionReceipt<MockPersona> => {
      assign(data.persona, {
        firstName: savedField(model, "firstName"),
        lastName: savedField(model, "lastName"),
        publicName: savedField(model, "publicName"),
        language: savedField(model, "language")
      });
      return { ok: true, entity: data.persona };
    },

    /**
     * Saves the answers to the brand's own questions. The definitions carry
     * their own answer (`MockClientCustomField`), so a save writes each one
     * back onto the field it belongs to rather than into a second store.
     *
     * CHANGE (plan §3): the real `useClientCustomFields` is a definitions
     * COLLECTION and publishes no write for the values, so this method is the
     * plan's own name rather than a real one.
     */
    saveCustomFields: (
      model: FormModel
    ): MockActionReceipt<MockPersona> | undefined => {
      // The answers ride under `customFields`, which is the wire's own request
      // branch and the scope the parser's controls are written against.
      const answers = get(model, "customFields", {});
      forEach(keys(answers), code => {
        const field = find(data.customFields, { code });
        if (field === undefined) return;
        assign(field, { value: customFieldValue(field, get(answers, code)) });
      });
      return { ok: true, entity: data.persona };
    },

    /**
     * Records how this client composes support replies — legacy's
     * `supportPreferencesModal`, whose client half is its new-line picker and
     * the shortcut question beside it.
     *
     * CHANGE (plan §3): legacy wrote this to USER META, which no client
     * module publishes; the persona is where the mock keeps what the account
     * knows about itself, so the preference lands beside the profile it is
     * asked from.
     */
    saveSupportPreferences: (
      model: SupportPreferencesModel
    ): MockActionReceipt<MockPersona> => {
      const preferences: MockSupportPreferences = {
        submitWithShortcut: model.submitWithShortcut,
        newLineKey: model.newLineKey
      };
      assign(data.persona, { supportPreferences: preferences });
      return { ok: true, entity: data.persona };
    },

    /** Changes the name the client signs in with; whitespace alone is not a name. */
    changeUsername: (
      model: FormModel
    ): MockActionReceipt<MockPersona> | undefined => {
      const username = trim(asText(model["username"]));
      if (username === "") {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.EMPTY_NAME,
          entity: data.persona
        };
      }
      assign(data.persona, { username });
      return { ok: true, entity: data.persona };
    }
  })
);
