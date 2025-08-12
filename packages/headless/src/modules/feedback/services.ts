// --- utils
import { find, isFunction } from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// --- types
import type { Message } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function processAction(context: Message, { data }: AnyEventObject) {
  const action = find(context.actions, ["value", data]);

  if (!action) {
    throw new DetailedError(
      `Action with value "${data}" not found.`,
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  }

  if (isFunction(action.handler)) {
    await action.handler(context);
  }

  return Promise.resolve();
}

export default {
  processAction
};
