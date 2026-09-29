import objectHash from "object-hash";
import { messageDisplays, messageTypes } from "./feedback.types";
import { defaultsDeep, omit, unset, omitBy, isEmpty } from "lodash-es";
import type { Message } from "./feedback.types";

// -----------------------------------------------------------------------------

export function generateHash(message: Message) {
  const cleaned = omitBy(
    omit(message, ["hash", "created", "scheduled"]),
    isEmpty
  );
  // A message's `data` can carry what the platform threw — a network error's
  // `cause` is a fetch `Response`, which object-hash cannot hash and throws on.
  return objectHash(cleaned, { algorithm: "sha1", ignoreUnknown: true });
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
