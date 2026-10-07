import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

interface Row {
  id: string;
  email: string;
  plan: string;
  token: string;
  createdAt: Date;
  notifiedAt: Date | null;
}

const rows: Row[] = [];
const users = new Map<string, { plan: string }>();

vi.mock("../db", () => ({
  db: {
    proWaitlist: {
      findUnique: async ({ where }: { where: Partial<Row> }) => rows.find((r) => (where.email ? r.email === where.email : r.token === where.token)) ?? null,
      create: async ({ data }: { data: Omit<Row, "id" | "createdAt" | "notifiedAt"> }) => {
        const row = { ...data, id: `w${rows.length}`, createdAt: new Date(), notifiedAt: null };
        rows.push(row);
        return row;
      },
      update: async ({ where, data }: { where: Partial<Row>; data: Partial<Row> }) => {
        const row = rows.find((r) => r.id === where.id || r.email === where.email)!;
        Object.assign(row, data);
        return row;
      },
      delete: async ({ where }: { where: Partial<Row> }) => rows.splice(rows.findIndex((r) => r.token === where.token), 1)[0],
      findMany: async () => rows.filter((r) => !r.notifiedAt),
      count: async (args?: { where?: { notifiedAt: null } }) => rows.filter((r) => !args?.where || !r.notifiedAt).length,
    },
    user: {
      updateMany: async () => ({ count: 0 }),
      findUnique: async ({ where }: { where: { email: string } }) => users.get(where.email) ?? null,
    },
  },
}));

const sent: { to: string; subject: string; text: string }[] = [];
vi.mock("../email", () => ({
  emailEnabled: () => true,
  escapeHtml: (s: string) => s,
  sendEmail: async (to: string, subject: string, text: string) => {
    sent.push({ to, subject, text });
  },
}));

import { isEmail, joinWaitlist, leaveWaitlist, normalizeEmail, sendLaunchEmails } from "../waitlist";

beforeEach(() => {
  rows.length = 0;
  sent.length = 0;
  users.clear();
});

describe("Pro list", () => {
  it("checks and tidies emails", () => {
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com");
    expect(isEmail("ana@example.com")).toBe(true);
    expect(["ana", "ana@", "@x.com", "a b@x.com"].some(isEmail)).toBe(false);
  });

  it("adds someone once and sends one confirmation with a leave link", async () => {
    expect(await joinWaitlist("ana@example.com", "pro", "https://slidezza.test")).toEqual({ created: true });
    expect(await joinWaitlist("ana@example.com", "max", "https://slidezza.test")).toEqual({ created: false });
    expect(rows).toHaveLength(1);
    expect(rows[0].plan).toBe("max");
    const mine = sent.filter((m) => m.to === "ana@example.com");
    expect(mine).toHaveLength(1);
    expect(mine[0].text).toContain(`https://slidezza.test/pro/leave?token=${rows[0].token}`);
  });

  it("removes people with their token, and ignores unknown tokens", async () => {
    await joinWaitlist("ana@example.com", "pro", "https://slidezza.test");
    expect(await leaveWaitlist("nope")).toBe(false);
    expect(await leaveWaitlist(rows[0].token)).toBe(true);
    expect(rows).toHaveLength(0);
  });

  it("tells each person once, skips people who already pay, and offers Pro until Max opens", async () => {
    await joinWaitlist("ana@example.com", "max", "https://slidezza.test");
    await joinWaitlist("ben@example.com", "pro", "https://slidezza.test");
    users.set("ben@example.com", { plan: "pro" });
    sent.length = 0;
    const result = await sendLaunchEmails("https://slidezza.test", { maxOpen: false });
    expect(result).toEqual({ sent: 1, failed: 0, left: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "ana@example.com", subject: expect.stringContaining("Pro is open") });
    expect((await sendLaunchEmails("https://slidezza.test")).sent).toBe(0);
  });
});
