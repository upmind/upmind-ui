// --- external
import { sha1 } from "object-hash";

// --- utils
import { defaultsDeep, omit, unset, omitBy, isEmpty } from "lodash-es";

// --- types
import type { Message } from "./types";
import { messageDisplays, messageTypes } from "./types";

// -----------------------------------------------------------------------------

export function generateHash(message: Message) {
  const cleaned = omitBy(
    omit(message, ["hash", "created", "scheduled"]),
    isEmpty
  );
  const hash = sha1(cleaned);
  return hash;
}

export const useMessageParser = (data?: object) => {
  const defaultMessage = {
    display: messageDisplays.TOAST,
    type: messageTypes.INFO,
    title: null,
    copy: null,
    data: null,
    delay: 0,
    maxAge: 0,
    created: Date.now(),
    i18nKey: null,
  };
  // TODO: pars einto a message format
  const message = defaultsDeep(data, defaultMessage);
  message.scheduled = Date.now() + (message?.delay || 0);

  unset(message, "id");
  return message;
};
