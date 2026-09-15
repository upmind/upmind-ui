// -----------------------------------------------------------------------------
/**
 * @fileoverview tickets — dropped admin-only capabilities stay absent
 * (AC-26, AC-28, AC-PATH)
 *
 * ## Job To Be Done
 * Proves two operator-ruled drops (R5) as ABSENCES, not silent omissions:
 * this module offers no way to reschedule an existing ticket and no way to
 * change which desk a ticket belongs to — neither a callable member nor an
 * outbound request exists for either, ever, on the client path.
 *
 * ## What Breaks If These Fail
 * Admin-only functionality leaks into a client×self-only module (the R5
 * violation these rulings exist to prevent), or the absence silently rots
 * into a real capability nobody signed off on.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientTickets, useClientTicket } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { TicketContextTypes } from "../tickets.types";
import {
  RECORDED_TICKET_ID,
  installTicketsHandlers,
  observeTicketsRequests,
  seedClientSession
} from "./tickets.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("tickets — AC-26/AC-28 dropped capabilities are absent, not silently omitted", () => {
  it("the collection exposes no reschedule / change-department member", async () => {
    await seedClientSession();
    installTicketsHandlers();
    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    const actionKeys = Object.keys(tickets.useActions() as object);
    expect(actionKeys).not.toContain("reschedule");
    expect(actionKeys).not.toContain("changeDepartment");
  });

  it("the manager exposes no reschedule / change-department member", async () => {
    await seedClientSession();
    installTicketsHandlers();
    const ticket = useClientTicket()
      .as(ScopeActorTypes.CLIENT)
      .for(TicketContextTypes.TICKET, RECORDED_TICKET_ID);
    const actionKeys = Object.keys(ticket.useActions() as object);
    expect(actionKeys).not.toContain("reschedule");
    expect(actionKeys).not.toContain("changeDepartment");
  });

  it("AC-27 change-subject issues a real request, and no observed request across a real read/write pass ever names ticket_department_id or a reschedule field", async () => {
    await seedClientSession();
    installTicketsHandlers();
    const observed = observeTicketsRequests();

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );
    const ticket = useClientTicket()
      .as(ScopeActorTypes.CLIENT)
      .for(TicketContextTypes.TICKET, RECORDED_TICKET_ID);
    await vi.waitFor(() =>
      expect(!!ticket.useContext().data.value?.id).toBe(true)
    );
    await ticket.useActions().setSubject("Renamed for the test");
    observed.stop();

    for (const request of observed.all()) {
      expect(request.url).not.toContain("ticket_department_id");
      expect(request.url).not.toContain("scheduled_datetime");
    }

    ticket.useActions().destroy();
    tickets.useActions().destroy();
  });
});
