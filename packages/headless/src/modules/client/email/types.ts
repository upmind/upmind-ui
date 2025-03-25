// --- internal
import { useClientEmail } from "./useClientEmail";

// --- types
import type { IEmail } from "@upmind-automation/types";
import type { PaginatedParams } from "../../query";
import type { ClientItemContext } from "../types";
// -----------------------------------------------------------------------------

export interface Email {
  //--- identifier
  id: IEmail["id"];
  //--- computed details
  title: string;
  description: string;
  //--- email details
  type: IEmail["type"];
  email: IEmail["email"];
  default: IEmail["default"];
}

export type UseClientEmail = ReturnType<typeof useClientEmail>;

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
  getAll: () => Promise<Email[]>;
  /**
   * Get a single email by id.
   * @param id The id of the email to get.
   * @returns A promise that resolves to an email or undefined.
   * @example getOne("123").then((email) => console.log(email))
   */
  getOne: (id: Email["id"]) => Email | undefined;
  /**
   * Get all the emails for the client in a paginated format.
   * @param params The pagination parameters to use.
   * @returns A promise that resolves to an array of emails.
   * @example getPaged({ limit: 10, offset: 0 }).then((emails) => console.log(emails))
   * @see {@link PaginatedParams} for the pagination parameters.
   */
  getPaged: (params: PaginatedParams) => Promise<Email[]>;
  /**
   * Get the default email for the client.
   * @returns A promise that resolves to an email or undefined.
   * @example getDefault().then((email) => console.log(email))
   */
  getDefault: () => Promise<Email | undefined>;
  /**
   * Filter the emails by id or email.
   * @param param The id or email to filter by.
   * @returns A promise that resolves to an array of emails.
   * @example filter("123").then((emails) => console.log(emails))
   */
  filter: (param: string) => Email[];
  /**
   * Find a single email based on the given param. The param is matched against the id and email.
   * @param param The filter to match against the email id and email.
   * @returns A promise that resolves to an email or undefined.
   * @example findOne("123").then((email) => console.log(email))
   */
  findOne: (param: string) => Email | undefined;
  /**
   * Get all the emails for the client from the cache.
   * @returns A promise that resolves to an array of emails.
   * @example getAllFromCache().then((emails) => console.log(emails))
   * @see {@link Email} for the email details.
   * @throws {@link CacheIsStaleError} when the cache is stale.
   */
  getAllFromCache: () => Email[];
}

export interface EmailContext extends ClientItemContext {}
