import { describe, expect, it } from "vitest";

import { independentSources, type Source } from "../research";

const web = (host: string): Source => ({ title: host, url: `https://${host}/page`, kind: "web" });

describe("independentSources", () => {
  it("counts all Wikipedia articles as one source and each website as one", () => {
    const wiki = (t: string): Source => ({ title: t, url: `https://en.wikipedia.org/wiki/${t}`, kind: "wikipedia" });
    expect(independentSources([wiki("A"), wiki("B")])).toBe(1);
    expect(independentSources([wiki("A"), web("who.int"), web("www.who.int"), web("nhs.uk")])).toBe(3);
  });

  it("doesn't count the user's own files, whose figures are used as given", () => {
    expect(independentSources([{ title: "file:report.pdf", url: "file:report.pdf", kind: "file" }])).toBe(0);
    expect(independentSources([])).toBe(0);
  });
});
