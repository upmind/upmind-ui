/** @internal */
import { useDate } from "../../utils";
import { map, castArray } from "lodash-es";
import type { Email, EmailModel } from "./client-email.types";
import type { IEmail } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-email/client-email.mappers
 * @description Wire ↔ view-model shaping for client emails. Pure — no side
 * effects, no HTTP, and never actor-scoped: a divergent response shape would
 * be expressed as an actor-named mapper chosen at a services arm's own
 * `select:` call site, not by scoping this file.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientEmails.ts` / `useClientEmailManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */

/** Maps the list response to the view-model collection. */
export const mapEmails = (raw: IEmail | IEmail[]): Email[] => {
  return map(castArray(raw), mapEmail);
};

/** Maps one wire record to the view-model. */
export const mapEmail = (raw: IEmail): Email => {
  return {
    id: raw.id,
    email: raw.email,
    title: raw.email,
    description: "",
    type: raw.type,
    bouncedAt: useDate(raw.bounced_at),
    meta: {
      isDefault: !!raw.default,
      canDelete: raw.can_delete,
      isVerified: !!raw.verified,
      isBounced: !!raw.bounced
    }
  };
};

/**
 * Maps the form model to the outbound request body.
 *
 * `type` is omitted — it is `const 1` / deprecated in the schema and the server
 * fixes it to Account. `verified: 0` on an EXISTING record is load-bearing: the
 * legacy form forced it whenever the address changed, so omitting it ships a
 * changed-but-still-verified address. The caller states the intent rather than
 * inferring it from `model.id`, which a partially-seeded form may not carry.
 */
export const mapIEmail = (
  model: EmailModel,
  { isExisting }: { isExisting: boolean } = { isExisting: false }
): Partial<IEmail> => {
  const data: Partial<IEmail> = { email: model.email ?? "" };

  if (isExisting) data.verified = 0;

  return data;
};
