// --- external

// --- internal
import type { ClientItemContext, ClientListingsContext } from "../types";
import { IEmail } from "@upmind-automation/types";
// -----------------------------------------------------------------------------

export interface EmailContext extends ClientItemContext {}

export interface EmailsContext extends ClientListingsContext {}

export interface UseClientEmails {
  /**
   * Check if the client emails query is ready.
   * @returns A promise that resolves to a boolean.
   * @example isReady().then((ready) => console.log("Emails are ready!", ready))
   */
  isReady: () => Promise<boolean>;
  /**
   * Get all the emails for the client.
   * @returns A promise that resolves to an array of emails.
   * @example getAll().then((emails) => console.log(emails))
   */
  getAll: () => Promise<IEmail[]>;
  /**
   * Get a single email by id.
   * @param id The id of the email to get.
   * @returns A promise that resolves to an email or undefined.
   * @example getOne("123").then((email) => console.log(email))
   */
  getOne: (id: IEmail["id"]) => Promise<IEmail | undefined>;
  /**
   * Get the default email for the client.
   * @returns A promise that resolves to an email or undefined.
   * @example getDefault().then((email) => console.log(email))
   */
  getDefault: () => Promise<IEmail | undefined>;
  /**
   * Filter the emails by id or email.
   * @param param The id or email to filter by.
   * @returns A promise that resolves to an array of emails.
   * @example filter("123").then((emails) => console.log(emails))
   */
  filter: (param: string) => Promise<IEmail[]>;
  /**
   * Find a single email based on the given param. The param is matched against the id and email.
   * @param param The filter to match against the email id and email.
   * @returns A promise that resolves to an email or undefined.
   * @example findOne("123").then((email) => console.log(email))
   */
  findOne: (param: string) => Promise<IEmail | undefined>;
  /**
   * Add a new email to the client.
   * @param email The email object to add.
   * @returns A promise that resolves to the added email.
   * @example add({ email: "test@upmind.com" }).then((email) => console.log(email))
   * @see {@link IEmail} for the email object structure.
   */
  add: (email: IEmail) => Promise<IEmail>;
  /**
   * Remove an email from the client.
   * @param id The id of the email to remove.
   * @returns A promise that resolves when the email is removed.
   * @example remove("123").then(() => console.log("Email removed!"))
   * @see {@link IEmail} for the email object structure.
   */
  remove: (id: IEmail["id"]) => Promise<IEmail>;
  /**
   * Update an email for the client.
   * @param email The email object to update.
   * @returns A promise that resolves to the updated email.
   * @example update({ id: "123", email: "info@upmind.com" }).then((email) => console.log(email))
   */
  update: (email: IEmail) => Promise<IEmail>;
  /**
   * Set the default email for the client.
   * @param email The email object to set as default.
   * @returns A promise that resolves when the default email is set.
   * @example setDefault("123").then(() => console.log("Default email set!"))
   * @see {@link IEmail} for the email object structure.
   */
  setDefault: (id: IEmail["id"]) => Promise<IEmail>;
}
