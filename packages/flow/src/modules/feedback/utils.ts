// --- global
import { sha1 } from "object-hash";

// --- utils
import { useTime } from "../../utils";
import { defaultsDeep, omit } from "lodash-es";

// --- types
import type { Message } from "./types.d";
import { messageDisplays, messageTypes } from "./types.d";

// --------------------------------------------------------

export function generateHash(message: Message) {
  const hash = sha1(omit(message, "hash"));
  return hash;
}

export const useMessageParser = (data: Object) => {
  const defaultMessage = {
    display: messageDisplays.TOAST,
    type: messageTypes.NEUTRAL,
    message: null,
    delay: 0,
    maxAge: useTime().SECOND * 3
  };
  // todo pars einto a message format
  return defaultsDeep(data, defaultMessage);
};
