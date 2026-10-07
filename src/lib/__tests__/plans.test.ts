import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ db: {} }));

import { allowance } from "../credits";
import { canExportPptx, canUseDepth, planOf } from "../plans";

describe("plans", () => {
  it("knows Free, Pro and Max, and treats anything else as Free", () => {
    expect(["free", "pro", "max", "gold"].map(planOf)).toEqual(["free", "pro", "max", "free"]);
  });

  it("gives detail levels and PowerPoint by plan", () => {
    expect(canUseDepth("free", "medium")).toBe(true);
    expect(canUseDepth("free", "high")).toBe(false);
    expect(canUseDepth("pro", "high")).toBe(true);
    expect([canExportPptx("free"), canExportPptx("pro"), canExportPptx("max")]).toEqual([false, true, true]);
  });

  it("refills Free and Pro, and rolls Max over up to twice the monthly credits", () => {
    expect(allowance("free", new Date(), 40).credits).toBe(60);
    expect(allowance("pro", new Date(), 500).credits).toBe(1000);
    expect(allowance("max", new Date(), 1500).credits).toBe(5500);
    expect(allowance("max", new Date(), 9000).credits).toBe(8000);
  });
});
