// A small in-memory stand-in for the parts of Prisma the job code uses, so the credit and job
// rules can be tested without a database. Transactions run one at a time, like the per-user
// advisory lock does in Postgres.

import { Prisma } from "@prisma/client";

type Row = Record<string, unknown> & { id: string };
type Where = Record<string, unknown>;

let counter = 0;
export const nextId = (prefix: string) => `${prefix}${++counter}`;

function matches(row: Row, where: Where = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key];
    if (cond && typeof cond === "object" && !(cond instanceof Date)) {
      const c = cond as Record<string, unknown>;
      if ("in" in c) return (c.in as unknown[]).includes(value);
      if ("gte" in c) return (value as number | Date) >= (c.gte as number | Date);
      if ("gt" in c) return (value as number | Date) > (c.gt as number | Date);
      if ("lte" in c) return (value as number | Date) <= (c.lte as number | Date);
      if ("lt" in c) return (value as number | Date) < (c.lt as number | Date);
    }
    return value === cond;
  });
}

function apply(row: Row, data: Record<string, unknown>) {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && !(value instanceof Date) && ("increment" in value || "decrement" in value)) {
      const v = value as { increment?: number; decrement?: number };
      row[key] = (row[key] as number) + (v.increment ?? 0) - (v.decrement ?? 0);
    } else row[key] = value;
  }
}

class Table {
  rows: Row[] = [];
  constructor(private defaults: () => Record<string, unknown> = () => ({}), private unique: string[][] = []) {}

  private clash(data: Record<string, unknown>) {
    return this.unique.some((cols) => cols.every((c) => data[c] !== null && data[c] !== undefined) && this.rows.some((r) => cols.every((c) => r[c] === data[c])));
  }

  insert(data: Record<string, unknown>): Row {
    const row = { ...this.defaults(), ...data } as Row;
    if (!row.id) row.id = nextId("row");
    if (this.clash(row)) throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "test" });
    this.rows.push(row);
    return { ...row };
  }

  async findFirst({ where, orderBy }: { where?: Where; orderBy?: Record<string, "asc" | "desc"> } = {}) {
    return (await this.findMany({ where, orderBy, take: 1 }))[0] ?? null;
  }
  async findUnique({ where }: { where: Where }) {
    const row = this.rows.find((r) => matches(r, where));
    return row ? { ...row } : null;
  }
  async findUniqueOrThrow(args: { where: Where }) {
    const row = await this.findUnique(args);
    if (!row) throw new Error("Not found");
    return row;
  }
  async findMany({ where, orderBy, take }: { where?: Where; orderBy?: Record<string, "asc" | "desc">; take?: number } = {}) {
    let rows = this.rows.filter((r) => matches(r, where));
    if (orderBy) {
      const [[key, dir]] = Object.entries(orderBy);
      rows = [...rows].sort((a, b) => ((a[key] as number | Date) < (b[key] as number | Date) ? -1 : (a[key] as number | Date) > (b[key] as number | Date) ? 1 : 0) * (dir === "desc" ? -1 : 1));
    }
    return (take ? rows.slice(0, take) : rows).map((r) => ({ ...r })); // copies, like Prisma returns
  }
  async count({ where }: { where?: Where } = {}) {
    return this.rows.filter((r) => matches(r, where)).length;
  }
  async updateMany({ where, data }: { where?: Where; data: Record<string, unknown> }) {
    const hit = this.rows.filter((r) => matches(r, where));
    hit.forEach((r) => apply(r, data));
    return { count: hit.length };
  }
  async update({ where, data }: { where: Where; data: Record<string, unknown> }) {
    const row = this.rows.find((r) => matches(r, where));
    if (!row) throw new Error("Not found");
    apply(row, data);
    return { ...row };
  }
}

export function createFakeDb() {
  const users = new Table();
  const cards = new Table(() => ({ status: "pending", content: "" }));
  const decks = new Table();
  const ledger = new Table(() => ({ createdAt: new Date() }), [["jobId", "type"]]);
  const jobsTable = new Table(
    () => ({ status: "queued", stage: "", attempts: 0, maxAttempts: 3, instruction: "", region: null, error: null, errorCode: null, provider: null, model: null, runAfter: new Date(0), lockedUntil: null, startedAt: null, finishedAt: null, createdAt: new Date(Date.now() + ++counter) }),
    [["idempotencyKey"]],
  );

  // One transaction at a time, standing in for the advisory lock. Writes are undone if it throws.
  let chain: Promise<unknown> = Promise.resolve();
  const tables = [users, cards, decks, ledger, jobsTable];
  const snapshot = () => tables.map((t) => t.rows.map((r) => ({ ...r })));
  const restore = (saved: Row[][]) => tables.forEach((t, i) => t.rows.splice(0, t.rows.length, ...saved[i]));

  const wrap = (t: Table, extra: Record<string, unknown> = {}) => ({
    findFirst: t.findFirst.bind(t),
    findUnique: t.findUnique.bind(t),
    findUniqueOrThrow: t.findUniqueOrThrow.bind(t),
    findMany: t.findMany.bind(t),
    count: t.count.bind(t),
    updateMany: t.updateMany.bind(t),
    update: t.update.bind(t),
    ...extra,
  });
  const ownedBy = (deck: { userId: string } | undefined, row: Row) => !deck || decks.rows.find((d) => d.id === row.deckId)?.userId === deck.userId;

  const db = {
    user: wrap(users),
    deck: wrap(decks),
    // Cards are looked up through their deck's owner, as the real queries do.
    card: wrap(cards, {
      findFirst: async ({ where }: { where: Where & { deck?: { userId: string } } }) => {
        const { deck, ...rest } = where;
        const row = cards.rows.find((r) => matches(r, rest) && ownedBy(deck, r));
        return row ? { ...row, deck: decks.rows.find((d) => d.id === row.deckId) } : null;
      },
      findMany: async ({ where, orderBy }: { where: Where & { deck?: { userId: string } }; orderBy?: Record<string, "asc" | "desc"> }) => {
        const { deck, ...rest } = where;
        return (await cards.findMany({ where: rest, orderBy })).filter((r) => ownedBy(deck, r));
      },
    }),
    creditLedger: wrap(ledger, {
      createMany: async ({ data, skipDuplicates }: { data: Record<string, unknown>[]; skipDuplicates?: boolean }) => {
        let count = 0;
        for (const d of data) {
          try {
            ledger.insert(d);
            count++;
          } catch (error) {
            if (!skipDuplicates) throw error;
          }
        }
        return { count };
      },
    }),
    generationJob: wrap(jobsTable, {
      create: async ({ data }: { data: Record<string, unknown> & { ledger?: { create: Record<string, unknown> } } }) => {
        const { ledger: nested, ...fields } = data;
        const row = jobsTable.insert(fields);
        if (nested) ledger.insert({ ...nested.create, jobId: row.id });
        return row;
      },
    }),
    $executeRaw: async () => 0,
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
      const run = chain.then(async () => {
        const saved = snapshot();
        try {
          return await fn(db);
        } catch (error) {
          restore(saved);
          throw error;
        }
      });
      chain = run.catch(() => undefined);
      return run;
    },
  };
  return { db, users, cards, decks, ledger, jobs: jobsTable };
}

/** One shared instance: the mocked "../db" module hands out its `db`. */
export const fake = createFakeDb();

export function resetFake() {
  for (const t of [fake.users, fake.cards, fake.decks, fake.ledger, fake.jobs]) t.rows.length = 0;
}

export function seedUser(fields: { credits: number; plan?: string }) {
  return fake.users.insert({ id: nextId("user"), plan: "free", ...fields }) as { id: string; credits: number; plan: string };
}

/** A deck with `cards` waiting cards. */
export function seedDeck(userId: string, cards = 1, mode = "standard") {
  const deck = fake.decks.insert({ id: nextId("deck"), userId, mode });
  const ids = Array.from({ length: cards }, (_, position) => fake.cards.insert({ id: nextId("card"), deckId: deck.id, position }).id);
  return { deckId: deck.id, cardIds: ids };
}
