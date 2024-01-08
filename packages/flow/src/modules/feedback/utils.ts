// --- global
import { sha1 } from "object-hash";

// --- utils
import { useTime } from "../../utils";
import { defaultsDeep } from "lodash-es";

// --- types
import { messageDisplays, messageTypes } from "./types.d";

// --------------------------------------------------------

export function generateHash(
  message: string,
  display?: messageDisplays,
  type?: messageTypes,
  delay?: number,
  maxAge?: number
) {
  const hash = sha1({ message, display, type, delay, maxAge });
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
