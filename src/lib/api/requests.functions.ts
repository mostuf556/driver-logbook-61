import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPool } from "../db.server";
import type { PendingRequest } from "../types";

// ─── helpers ────────────────────────────────────────────────────────────────

function rowToRequest(row: Record<string, unknown>): PendingRequest {
  return {
    id: row.id as string,
    firstName: (row.first_name as string) ?? "",
    lastName: (row.last_name as string) ?? "",
    idNumber: (row.id_number as string) ?? "",
    phone: (row.phone as string) ?? "",
    carNumber: (row.car_number as string) ?? "",
    company: (row.company as string) ?? "",
    requestedAt: (row.requested_at as Date).toISOString(),
    note: (row.note as string | null) ?? undefined,
    date: (row.date as string | null) ?? undefined,
    entryTime: (row.entry_time as string | null) ?? undefined,
    estimatedExitTime: (row.estimated_exit_time as string | null) ?? null,
    approverName: (row.approver_name as string | null) ?? undefined,
    guardName: (row.guard_name as string | null) ?? undefined,
  };
}

// ─── server functions ────────────────────────────────────────────────────────

export const listPendingRequestsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT * FROM pending_requests ORDER BY requested_at DESC",
    );
    return rows.map(rowToRequest);
  },
);

const PendingRequestSchema = z.object({
  id: z.string(),
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  idNumber: z.string().default(""),
  phone: z.string().default(""),
  carNumber: z.string().default(""),
  company: z.string().default(""),
  requestedAt: z.string(),
  note: z.string().optional(),
  date: z.string().optional(),
  entryTime: z.string().optional(),
  estimatedExitTime: z.string().nullable().optional(),
  approverName: z.string().optional(),
  guardName: z.string().optional(),
});

export const addPendingRequestFn = createServerFn({ method: "POST" })
  .validator(PendingRequestSchema)
  .handler(async ({ data }) => {
    const pool = getPool();
    await pool.query(
      `INSERT INTO pending_requests
         (id, first_name, last_name, id_number, phone, car_number, company,
          requested_at, note, date, entry_time, estimated_exit_time, approver_name, guard_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO NOTHING`,
      [
        data.id,
        data.firstName,
        data.lastName,
        data.idNumber,
        data.phone,
        data.carNumber,
        data.company,
        data.requestedAt,
        data.note ?? null,
        data.date ?? null,
        data.entryTime ?? null,
        data.estimatedExitTime ?? null,
        data.approverName ?? null,
        data.guardName ?? null,
      ],
    );
    return { ok: true };
  });

export const removePendingRequestFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const pool = getPool();
    await pool.query("DELETE FROM pending_requests WHERE id = $1", [data.id]);
    return { ok: true };
  });
