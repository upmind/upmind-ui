// --- internal
import { useI18n } from "../system";

// --- utils
import { find, isFunction } from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// --- types
import type { Message } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function processAction(context: Message, { data }: AnyEventObject) {
  const { t } = useI18n();
  // MAYBE we need to force lowercase on value and data....
  const action = find(context.actions, ["value", data]);

  if (!action) {
    throw new DetailedError(
      t("error.feedback_action_not_available", { data }),
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
