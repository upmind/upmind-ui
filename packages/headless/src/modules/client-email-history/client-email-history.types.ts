import { SortDirection } from "../query/query.types";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { QuerySortEntry } from "../query/query.types";
import type { JsonSchema7 } from "@jsonforms/core";
import type { IClient, IImage, ISentEmail } from "@upmind-automation/types";
import type { SentEmailStatus } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * An array of predefined email types, used for categorising different kinds of email addresses.
 */
// export const EmailTypes = [{ key: 1, value: "Account" }];

/**
 * Interface representing the data model for an email address, suitable for forms
 * or API payloads.
 */
export interface SentEmailModel {
  /**
   * Optional unique identifier for the email address. Present if editing an existing email.
   */
  id?: ISentEmail["id"];
}

/**
 * Interface representing a comprehensive email object, extending {@link SentEmailModel}
 * with additional identifiers, computed display fields, and meta-data about its status.
 * This is typically used for email addresses retrieved from the API or displayed in the UI.
 */
export interface SentEmail extends SentEmailModel {
  //--- identifier
  /**
   * The unique identifier for the email address.
   */
  id: ISentEmail["id"];
  /**
   * The body content of the email address.
   */
  body: string;
  /**
   * The sender of the email.
   */
  from: ISentEmail["from"];
  //--- computed details
  /**
   * The subject line of the email address.
   */
  subject: ISentEmail["subject"];
  /**
   * The recipient(s) of the email.
   */
  to: ISentEmail["to"];
  /**
   * The date and time when the email was sent.
   */
  dateBounced: {
    date?: string | null;
    relative?: string | null;
  };
  /**
   * The date and time when the email errored.
   */
  dateErrored: {
    date?: string | null;
    relative?: string | null;
  };
  /**
   * The date and time when the email was sent.
   */
  dateSent: {
    date?: string | null;
    relative?: string | null;
  };
  /**
   * The current status of the email address.
   */
  status: SentEmailStatus;
  /**
   * Information about the recipient of the email.
   */
  recipient: {
    name: IClient["fullname"];
    email: IClient["email"];
    imageUrl: IImage["full_url"];
  };
  // --- meta info
  /**
   * Meta-information about the email address's status and capabilities.
   */
  meta: {
    /**
     * `true` if this is the client's default email address.
     */
    isBounced: boolean;
    /**
     * `true` if there was an error sending the email.
     */
    isError: boolean;
    /**
     * `true` if the email was sent successfully.
     */
    isSent: boolean;
  };
}

/**
 * Interface representing the context for email management within a client item context.
 * It extends `DataManagerContext` with specific data relevant to email operations.
 *
 * @template TModel - The type of the email model, typically {@link SentEmailModel}.
 */
export type SentEmailContext = DataManagerContext<SentEmailModel>;

// -----------------------------------------------------------------------------
// QUERY MODEL — the collection's whole request state as ONE model
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (nested column → operator →
 * value), `sort` (ordered, precedence = position) and `pagination`. This is the
 * instance validated against `useQuerySchema()`; the translator maps it to the
 * `QueryProps` the query layer accepts. No `query` member: this endpoint
 * honours no free-text term, so the search box binds `filters.subject.like`.
 *
 * @graphify-citation `graphify query "module query model filter sort pagination
 * schema"` (2026-08-10) — no `SentEmailQueryModel` / `SentEmailQuerySchema` node anywhere in
 * `graphify-out/graph.json`. The query platform's `QueryProps` describes the
 * WIRE shape; this describes the schema-validated MODEL. No duplicate to
 * consume, so minting here is warranted.
 */
export type SentEmailQueryModel = {
  filters?: {
    subject?: { like?: string };
    sent?: { eq?: boolean };
    bounced?: { eq?: boolean };
    error_id?: { neq?: string };
  };
  sort?: QuerySortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/**
 * The order the list starts in — newest first. Declared as the query schema's
 * `sort` default, so an emptied sort refills itself on the next parse.
 */
export const SENT_EMAIL_DEFAULT_SORT: QuerySortEntry[] = [
  { field: "created_at", dir: SortDirection.DESC }
];

/**
 * The collection's query schema. A `JsonSchema7`: the translator and the
 * validators walk it at runtime, so the type stays general rather than a
 * module-specific literal.
 */
export type SentEmailQuerySchema = JsonSchema7;
