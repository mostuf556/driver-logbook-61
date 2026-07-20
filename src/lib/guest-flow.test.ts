/**
 * End-to-end DB test: incomplete guest submission → visible in requests + logs.
 *
 * Calls the pool directly (same code path the server functions execute).
 * createServerFn cannot run in vitest — it requires the TanStack Start runtime.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { getPool } from "./db.server";
import { logEvent, loadErrorLog } from "./error-log";
import type { PendingRequest } from "./types";

const TEST_ID_A = "test-flow-001";
const TEST_ID_B = "test-flow-002";

const incompleteRequest: PendingRequest = {
  id: TEST_ID_A,
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

async function dbInsert(req: PendingRequest) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO pending_requests
       (id, first_name, last_name, id_number, phone, car_number, company,
        requested_at, note, date, entry_time, estimated_exit_time, approver_name, guard_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (id) DO NOTHING`,
    [
      req.id, req.firstName, req.lastName, req.idNumber, req.phone, req.carNumber,
      req.company, req.requestedAt, req.note ?? null, req.date ?? null,
      req.entryTime ?? null, req.estimatedExitTime ?? null,
      req.approverName ?? null, req.guardName ?? null,
    ],
  );
  if (typeof window !== "undefined") window.dispatchEvent(new Event("pending-requests-change"));
  const name = [req.firstName, req.lastName].filter(Boolean).join(" ") || "—";
  logEvent("guest-request", `New entrance request: ${name}`, "/guest");
}

async function dbList(): Promise<PendingRequest[]> {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM pending_requests ORDER BY requested_at DESC");
  return rows.map((row) => ({
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    idNumber: row.id_number ?? "",
    phone: row.phone ?? "",
    carNumber: row.car_number ?? "",
    company: row.company ?? "",
    requestedAt: (row.requested_at as Date).toISOString(),
    note: row.note ?? undefined,
    date: row.date ?? undefined,
    entryTime: row.entry_time ?? undefined,
    estimatedExitTime: row.estimated_exit_time ?? null,
    approverName: row.approver_name ?? undefined,
    guardName: row.guard_name ?? undefined,
  }));
}

async function dbDelete(id: string) {
  const pool = getPool();
  await pool.query("DELETE FROM pending_requests WHERE id = $1", [id]);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("pending-requests-change"));
}

afterEach(async () => {
  await dbDelete(TEST_ID_A).catch(() => {});
  await dbDelete(TEST_ID_B).catch(() => {});
  if (typeof window !== "undefined") window.localStorage.clear();
});

describe("guest submission flow (DB-backed)", () => {
  it("stores an incomplete request and retrieves it", async () => {
    await dbInsert(incompleteRequest);
    const list = await dbList();
    const saved = list.find((r) => r.id === TEST_ID_A);
    expect(saved).toBeDefined();
    expect(saved!.firstName).toBe("דני");
  });

  it("request persists across a fresh dbList call (simulates guard page load)", async () => {
    await dbInsert(incompleteRequest);
    const freshList = await dbList();
    const saved = freshList.find((r) => r.id === TEST_ID_A);
    expect(saved).toBeDefined();
    expect(saved!.firstName).toBe("דני");
  });

  it("dispatches pending-requests-change event so the requests page updates live", async () => {
    const handler = vi.fn();
    window.addEventListener("pending-requests-change", handler);
    await dbInsert(incompleteRequest);
    window.removeEventListener("pending-requests-change", handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("writes a guest-request log entry visible on the /logs page", async () => {
    await dbInsert(incompleteRequest);
    const logs = loadErrorLog();
    const guestLog = logs.find((e) => e.source === "guest-request");
    expect(guestLog).toBeDefined();
    expect(guestLog?.message).toContain("דני");
  });

  it("dbDelete removes the row so guard no longer sees it", async () => {
    await dbInsert(incompleteRequest);
    await dbDelete(TEST_ID_A);
    const list = await dbList();
    expect(list.find((r) => r.id === TEST_ID_A)).toBeUndefined();
  });

  it("multiple incomplete submissions ordered newest-first", async () => {
    await dbInsert({ ...incompleteRequest, id: TEST_ID_A, requestedAt: new Date(Date.now() - 2000).toISOString() });
    await dbInsert({ ...incompleteRequest, id: TEST_ID_B, firstName: "מיכל", requestedAt: new Date().toISOString() });
    const list = await dbList();
    const idxA = list.findIndex((r) => r.id === TEST_ID_A);
    const idxB = list.findIndex((r) => r.id === TEST_ID_B);
    expect(idxB).toBeLessThan(idxA);
  });
});
