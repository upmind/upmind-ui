import { sha1 } from "object-hash";
import { messageDisplays, messageTypes } from "./feedback.types";
import { defaultsDeep, omit, unset, omitBy, isEmpty } from "lodash-es";
import type { Message } from "./feedback.types";

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
    created: Date.now()
  };
  // TODO: parse into a message format
  const message = defaultsDeep(data, defaultMessage);
  message.scheduled = Date.now() + (message?.delay || 0);

  unset(message, "id");
  return message;
};
