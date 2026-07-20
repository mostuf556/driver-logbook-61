/**
 * End-to-end logic test: incomplete guest submission → visible in requests + logs.
 *
 * Covers:
 * 1. addPendingRequest saves an incomplete request (only firstName filled)
 * 2. loadPendingRequests returns it immediately
 * 3. A second call to loadPendingRequests (simulating the /requests page re-mounting) still returns it
 * 4. The event "pending-requests-change" is dispatched so live listeners are notified
 * 5. logEvent writes a guest-request entry readable by loadErrorLog
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { addPendingRequest, loadPendingRequests } from "./requests";
import { loadErrorLog } from "./error-log";
import type { PendingRequest } from "./types";

// Minimal incomplete guest entry — only firstName, everything else blank/null
const incompleteRequest: PendingRequest = {
  id: "test-001",
  firstName: "דני",
  lastName: "",
  idNumber: "",
  phone: "",
  carNumber: "",
  company: "",
  requestedAt: new Date().toISOString(),
  date: "2026-07-20",
  entryTime: "09:00",
  estimatedExitTime: null,
  approverName: "",
  guardName: "",
};

describe("guest submission flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores an incomplete request in localStorage", () => {
    addPendingRequest(incompleteRequest);
    const list = loadPendingRequests();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("test-001");
    expect(list[0].firstName).toBe("דני");
  });

  it("request persists across a fresh loadPendingRequests call (simulates page navigation)", () => {
    addPendingRequest(incompleteRequest);
    // Simulate /requests page mounting fresh and calling loadPendingRequests
    const freshList = loadPendingRequests();
    expect(freshList).toHaveLength(1);
    expect(freshList[0].firstName).toBe("דני");
  });

  it("dispatches pending-requests-change event so the requests page updates live", () => {
    const handler = vi.fn();
    window.addEventListener("pending-requests-change", handler);
    addPendingRequest(incompleteRequest);
    window.removeEventListener("pending-requests-change", handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("writes a guest-request log entry visible on the /logs page", () => {
    addPendingRequest(incompleteRequest);
    const logs = loadErrorLog();
    const guestLog = logs.find((e) => e.source === "guest-request");
    expect(guestLog).toBeDefined();
    expect(guestLog?.message).toContain("דני");
  });

  it("multiple incomplete submissions stack correctly", () => {
    addPendingRequest({ ...incompleteRequest, id: "a" });
    addPendingRequest({ ...incompleteRequest, id: "b", firstName: "מיכל" });
    const list = loadPendingRequests();
    expect(list).toHaveLength(2);
    // newest first
    expect(list[0].id).toBe("b");
    expect(list[1].id).toBe("a");
  });
});
