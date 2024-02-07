// --- global
import { sha1 } from "object-hash";

// --- utils
import { defaultsDeep, omit, unset, omitBy, isEmpty } from "lodash-es";

// --- types
import type { Message } from "./types.d";
import { messageDisplays, messageTypes } from "./types.d";

// --------------------------------------------------------

export function generateHash(message: Message) {
  const cleaned = omitBy(
    omit(message, ["hash", "created", "scheduled"]),
    isEmpty
  );
  const hash = sha1(cleaned);
  return hash;
}

export const useMessageParser = (data: Object) => {
  const defaultMessage = {
    display: messageDisplays.TOAST,
    type: messageTypes.NEUTRAL,
    title: null,
    copy: null,
    data: null,
    delay: 0,
    maxAge: 0
  };
  // todo pars einto a message format
  const message = defaultsDeep(data, defaultMessage);
  unset(message, "id");

  return message;
};
