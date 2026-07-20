import { logEvent } from "./error-log";
import {
  addPendingRequestFn,
  listPendingRequestsFn,
  removePendingRequestFn,
} from "./api/requests.functions";
import type { PendingRequest } from "./types";

/** Notify all in-page listeners that the list changed. */
function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pending-requests-change"));
  }
}

export async function loadPendingRequests(): Promise<PendingRequest[]> {
  return listPendingRequestsFn();
}

export async function addPendingRequest(req: PendingRequest): Promise<void> {
  await addPendingRequestFn({ data: req });
  notifyChange();
  const name = [req.firstName, req.lastName].filter(Boolean).join(" ") || "—";
  logEvent(
    "guest-request",
    `New entrance request: ${name}${req.carNumber ? ` · ${req.carNumber}` : ""}${req.company ? ` (${req.company})` : ""}`,
    "/guest",
  );
}

export async function removePendingRequest(id: string): Promise<void> {
  await removePendingRequestFn({ data: { id } });
  notifyChange();
}
