import type { DataManagerContext } from "../data-manager/data-manager.types";
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
