import type { IClient } from "@upmind-automation/types";
import type { AccessRoleTypes } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module session-transfer/types
 * @description Types for session transfer functionality.
 */
// -----------------------------------------------------------------------------
/**
 * Interface representing the data for an authenticated session transfer.
 * This is used to securely transfer session context between different parts
 * of an application or between micro-frontends.
 */
export type IAuthTransfer = {
  /**
   * The unique identifier of the client associated with the transfer.
   */
  client_id: IClient["id"];
  /**
   * The one-time transfer code generated for the session.
   */
  code: string;
  /**
   * The type of actor involved in the transfer (e.g. 'client', 'user').
   */
  actor_type: AccessRoleTypes;
  /**
   * The unique identifier of the actor (user or client) performing the transfer.
   */
  actor_id: IClient["id"];
  /**
   * The URL to which the client should be redirected after a successful transfer.
   */
  redirect_url: string;
};

/**
 * Interface representing the details of an active or pending session transfer.
 */
export type SessionTransfer = {
  /**
   * The transfer code used to initiate or identify the session transfer.
   */
  code: string | null;
  /**
   * The redirect URL associated with the transfer, if any.
   */
  redirect: string | null;
  /**
   * An optional authentication token provided as part of the transfer process.
   */
  token?: string | null;
};

/**
 * Context for transfer operations.
 */
export type TransferContext = {
  transfer?: SessionTransfer;
};
